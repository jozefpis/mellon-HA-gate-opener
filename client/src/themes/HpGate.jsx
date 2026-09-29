import { useEffect, useRef, useState } from 'react';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import './hp.css';

export default function HpGate({
  link,
  status,
  countdown,
  error,
  open,
  idle = '/harry-potter.png',
  active = '/harry-potter-activated.png',
  tagline = 'hp_tagline',
  objectPosition = 'center 40%',
  buttonKey, // translation key for the button; falls back to the "Alohomora" charm
  variant, // optional color variant class, e.g. 'sg' for the cyan Stargate palette
  video, // optional { intro, loop, poster, openStill }: animated scene instead of the image pair
}) {
  const { t } = useI18n();
  const buttonLabel = buttonKey ? t(buttonKey) : 'Alohomora';
  const remaining = link?.remaining ?? 0;
  const isOpen = status === 'opening' || status === 'success';
  const canPress = status === 'ready';
  const { introRef, loopRef, introPlaying, looping, stillOnly } = useSceneVideo(video, isOpen);

  return (
    <div
      className={`hp-theme ${variant ? `variant-${variant}` : ''} ${isOpen ? 'is-open' : ''}`}
    >
      <LocaleSwitcher className="on-dark" />

      {/* Idle scene cross-fades to the activated (spell-cast) scene on top */}
      <div className="hp-bg" aria-hidden>
        {video ? (
          <>
            {/* The still stays underneath so nothing flashes while a video starts */}
            <img className="hp-img" src={video.poster} alt="" style={{ objectPosition }} />
            {/* Intro plays once on open, then hands over to a seamless loop */}
            <video
              ref={introRef}
              className={`hp-img hp-video ${introPlaying ? 'on' : ''}`}
              src={video.intro}
              muted
              playsInline
              preload="auto"
              style={{ objectPosition }}
            />
            <video
              ref={loopRef}
              className={`hp-img hp-video ${looping ? 'on' : ''}`}
              src={video.loop}
              muted
              playsInline
              loop
              preload="auto"
              style={{ objectPosition }}
            />
            {stillOnly && (
              <img className="hp-img" src={video.openStill} alt="" style={{ objectPosition }} />
            )}
          </>
        ) : (
          <>
            <img className="hp-img idle" src={idle} alt="" style={{ objectPosition }} />
            <img className="hp-img active" src={active} alt="" style={{ objectPosition }} />
          </>
        )}
      </div>
      <div className="hp-scrim" aria-hidden />

      <div className="hp-content">
        {canPress && (
          <>
            <p className="hp-tagline">{t(tagline)}</p>
            <button className="alohomora-btn" onClick={open}>
              <span>{buttonLabel}</span>
            </button>
            <p className="hp-remaining">
              {t('basic_remaining', { remaining, max: link.max_uses })}
            </p>
            {error && <p className="hp-error">{t(error)}</p>}
          </>
        )}

        {status === 'sending' && (
          <p className="hp-line">
            <span className="spinner" /> {t('basic_sending')}
          </p>
        )}

        {status === 'opening' && (
          <div className="hp-state">
            <p className="hp-line glow">{t('basic_opening')}</p>
            <div className="hp-count">{countdown}</div>
          </div>
        )}

        {status === 'success' && (
          <div className="hp-state">
            <p className="hp-line glow">{t('basic_success_title')}</p>
            <p className="hp-tagline">
              {remaining > 0
                ? t('basic_success_remaining', { n: remaining })
                : t('basic_success_last')}
            </p>
          </div>
        )}

        {status === 'limit' && (
          <div className="hp-state">
            <p className="hp-line">{t('basic_limit')}</p>
          </div>
        )}

        {status === 'disabled' && (
          <div className="hp-state">
            <p className="hp-line">{t('basic_disabled')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Drives the intro → loop video pair. If playback is refused (e.g. iOS Low
// Power Mode blocks even muted autoplay) it falls back to a still of the open gate.
function useSceneVideo(video, isOpen) {
  const introRef = useRef(null);
  const loopRef = useRef(null);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [looping, setLooping] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);

  useEffect(() => {
    const intro = introRef.current;
    const loop = loopRef.current;
    if (!video || !intro || !loop) return;
    if (!isOpen) {
      intro.pause();
      loop.pause();
      intro.currentTime = 0;
      setIntroPlaying(false);
      setLooping(false);
      setStillOnly(false);
      return;
    }
    // Reveal each video only once it is really rendering frames
    const showIntro = () => setIntroPlaying(true);
    const showLoop = () => setLooping(true);
    const toLoop = () => {
      loop.currentTime = 0;
      loop.play().catch(() => setStillOnly(true));
    };
    intro.addEventListener('playing', showIntro);
    intro.addEventListener('ended', toLoop);
    loop.addEventListener('playing', showLoop);
    intro.play().catch(() => setStillOnly(true));
    return () => {
      intro.removeEventListener('playing', showIntro);
      intro.removeEventListener('ended', toLoop);
      loop.removeEventListener('playing', showLoop);
    };
  }, [video, isOpen]);

  return { introRef, loopRef, introPlaying, looping, stillOnly };
}
