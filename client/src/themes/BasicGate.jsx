import { OPEN_COUNTDOWN } from '../useGate.js';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import './basic.css';

export default function BasicGate({ link, status, countdown, error, open }) {
  const { t } = useI18n();
  const remaining = link?.remaining ?? 0;
  const progress = 1 - countdown / OPEN_COUNTDOWN;

  return (
    <div className="screen basic-theme">
      <LocaleSwitcher />
      <div className="basic-inner">
        <div className="basic-icon" aria-hidden>
          <GateGlyph open={status === 'success' || status === 'opening'} />
        </div>

        <h1>{link?.label || t('basic_default_title')}</h1>

        {status === 'ready' && (
          <>
            <p className="basic-sub">
              {t('basic_remaining', { remaining, max: link.max_uses })}
            </p>
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
          <div className="basic-countdown">
            <div className="ring" style={{ '--p': progress }}>
              <span>{countdown}s</span>
            </div>
            <p className="basic-sub">{t('basic_opening')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="basic-result ok">
            <div className="tick">✓</div>
            <p className="basic-sub">{t('basic_success_title')}</p>
            <p className="basic-note">
              {remaining > 0
                ? t('basic_success_remaining', { n: remaining })
                : t('basic_success_last')}
            </p>
          </div>
        )}

        {status === 'limit' && (
          <div className="basic-result closed">
            <div className="lock">🔒</div>
            <p className="basic-sub">{t('basic_limit')}</p>
          </div>
        )}

        {status === 'disabled' && (
          <div className="basic-result closed">
            <div className="lock">🚫</div>
            <p className="basic-sub">{t('basic_disabled')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GateGlyph({ open }) {
  return (
    <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="10" width="52" height="44" rx="4" stroke="currentColor" strokeWidth="3" opacity="0.35" />
      <g style={{ transition: 'transform .6s ease', transform: open ? 'translateX(-9px)' : 'none' }}>
        <rect x="10" y="14" width="20" height="36" rx="2" fill="currentColor" opacity="0.9" />
      </g>
      <g style={{ transition: 'transform .6s ease', transform: open ? 'translateX(9px)' : 'none' }}>
        <rect x="34" y="14" width="20" height="36" rx="2" fill="currentColor" opacity="0.9" />
      </g>
    </svg>
  );
}
