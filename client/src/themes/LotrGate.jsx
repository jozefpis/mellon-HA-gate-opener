import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import SceneVideo from './SceneVideo.jsx';
import './lotr.css';

// Ithildin reveal: strokes light up from the pillar bases, the inscription is
// written, the pillars fill with starlight, then a looping glow. Rendered on
// black so the `screen` blend leaves only the light over the starry sky.
const DOORS_VIDEO = {
  intro: '/lotr-intro.mp4',
  loop: '/lotr-loop.mp4',
  poster: '/lotr-poster.jpg',
  openStill: '/lotr-open.jpg',
};

export default function LotrGate({ link, status, countdown, error, open }) {
  const { t } = useI18n();
  const remaining = link?.remaining ?? 0;
  const isOpen = status === 'opening' || status === 'success';
  const canPress = status === 'ready';
  const closed = status === 'limit' || status === 'disabled';

  return (
    <div className={`lotr-theme ${isOpen ? 'is-open' : ''}`}>
      <LocaleSwitcher className="on-dark" />
      <div className="stars" aria-hidden />

      <div className="doors" aria-hidden>
        <SceneVideo video={DOORS_VIDEO} isOpen={isOpen} className="doors-img" />
      </div>

      <div className="lotr-content">
        {canPress && (
          <>
            <p className="lotr-translate">{t('lotr_translate')}</p>
            <button className="mellon-btn" onClick={open}>
              <span>Mellon</span>
            </button>
            <p className="lotr-remaining">{t('lotr_remaining', { n: remaining })}</p>
            {error && <p className="lotr-error">{t(error)}</p>}
          </>
        )}

        {status === 'sending' && (
          <p className="lotr-inscription">
            <span className="spinner" /> {t('lotr_speaking')}
          </p>
        )}

        {status === 'opening' && (
          <div className="lotr-opening">
            <p className="lotr-inscription glow">{t('lotr_opening_title')}</p>
            <div className="lotr-count">{countdown}</div>
            <p className="lotr-translate">{t('lotr_welcome')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="lotr-opening">
            <p className="lotr-inscription glow">{t('lotr_open_title')}</p>
            <p className="lotr-translate">
              {remaining > 0
                ? t('lotr_open_remaining', { n: remaining })
                : t('lotr_open_last')}
            </p>
          </div>
        )}

        {closed && (
          <div className="lotr-closed">
            <p className="lotr-inscription">
              {status === 'disabled' ? t('lotr_closed_title') : t('lotr_sealed_title')}
            </p>
            <p className="lotr-translate">
              {status === 'disabled' ? t('lotr_disabled_text') : t('lotr_limit_text')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
