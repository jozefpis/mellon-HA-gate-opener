import { OPEN_COUNTDOWN } from '../useGate.js';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import SceneVideo from './SceneVideo.jsx';
import './basic.css';

// The real gate at night: a single-leaf sliding gate (aluminium frame, WPC
// infill) slides left behind the fence while the beacon flashes; then a loop.
const SLIDING_GATE_VIDEO = {
  intro: '/basic-intro.mp4',
  loop: '/basic-loop.mp4',
  poster: '/basic-poster.jpg',
  openStill: '/basic-open.jpg',
};

export default function BasicGate({ link, status, countdown, error, open }) {
  const { t } = useI18n();
  const remaining = link?.remaining ?? 0;
  const isOpen = status === 'opening' || status === 'success';
  const progress = 1 - countdown / OPEN_COUNTDOWN;

  return (
    <div className="basic-theme">
      <LocaleSwitcher className="on-dark" />

      <div className="basic-bg" aria-hidden>
        <SceneVideo video={SLIDING_GATE_VIDEO} isOpen={isOpen} className="basic-img" />
      </div>
      <div className="basic-scrim" aria-hidden />

      <header className="basic-head">
        <p className="basic-eyebrow">Mellon</p>
        <h1>{link?.label || t('basic_default_title')}</h1>
        {link && (
          <span className="basic-pill">
            {t('basic_remaining', { remaining, max: link.max_uses })}
          </span>
        )}
      </header>

      <div className="basic-controls">
        {status === 'ready' && (
          <>
            <button className="basic-btn" onClick={open}>
              {t('basic_open')}
            </button>
            {error && <p className="basic-error">{t(error)}</p>}
          </>
        )}

        {status === 'sending' && (
          <button className="basic-btn" disabled>
            <span className="spinner" /> {t('basic_sending')}
          </button>
        )}

        {status === 'opening' && (
          <div className="basic-state">
            <p className="basic-status">{t('basic_opening')}</p>
            <div className="basic-count">{countdown}</div>
            <div className="basic-bar">
              <i style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="basic-state">
            <p className="basic-status ok">{t('basic_success_title')}</p>
            <p className="basic-sub">
              {remaining > 0
                ? t('basic_success_remaining', { n: remaining })
                : t('basic_success_last')}
            </p>
          </div>
        )}

        {status === 'limit' && (
          <div className="basic-state">
            <p className="basic-status">🔒 {t('basic_limit')}</p>
          </div>
        )}

        {status === 'disabled' && (
          <div className="basic-state">
            <p className="basic-status">🚫 {t('basic_disabled')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
