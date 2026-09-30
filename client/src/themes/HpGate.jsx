import { useEffect, useRef } from 'react';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import SceneVideo from './SceneVideo.jsx';
import OpeningMusic from './OpeningMusic.jsx';
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
  music, // optional { uri, startAt, stopAt }: Spotify track started by the button
}) {
  const { t } = useI18n();
  const buttonLabel = buttonKey ? t(buttonKey) : 'Alohomora';
  const remaining = link?.remaining ?? 0;
  const isOpen = status === 'opening' || status === 'success';
  const canPress = status === 'ready';
  const musicRef = useRef(null);

  // the open request failed (back to the button) or was refused: stop the music
  useEffect(() => {
    if (status === 'ready' || status === 'limit' || status === 'disabled') musicRef.current?.stop();
  }, [status]);

  const cast = () => {
    musicRef.current?.start(); // inside the click, so the browser lets it play
    open();
  };

  return (
    <div
      className={`hp-theme ${variant ? `variant-${variant}` : ''} ${isOpen ? 'is-open' : ''}`}
    >
      <LocaleSwitcher className="on-dark" />
      {music && <OpeningMusic ref={musicRef} track={music} />}

      {/* Idle scene cross-fades to the activated (spell-cast) scene on top */}
      <div className="hp-bg" aria-hidden>
        {video ? (
          <SceneVideo video={video} isOpen={isOpen} className="hp-img" style={{ objectPosition }} />
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
            <button className="alohomora-btn" onClick={cast}>
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

