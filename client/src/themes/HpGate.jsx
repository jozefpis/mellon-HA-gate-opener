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
}) {
  const { t } = useI18n();
  const remaining = link?.remaining ?? 0;
  const isOpen = status === 'opening' || status === 'success';
  const canPress = status === 'ready';

  return (
    <div className={`hp-theme ${isOpen ? 'is-open' : ''}`}>
      <LocaleSwitcher className="on-dark" />

      {/* Idle scene cross-fades to the activated (spell-cast) scene on top */}
      <div className="hp-bg" aria-hidden>
        <img className="hp-img idle" src={idle} alt="" style={{ objectPosition }} />
        <img className="hp-img active" src={active} alt="" style={{ objectPosition }} />
      </div>
      <div className="hp-scrim" aria-hidden />

      <div className="hp-content">
        {canPress && (
          <>
            <p className="hp-tagline">{t(tagline)}</p>
            <button className="alohomora-btn" onClick={open}>
              <span>Alohomora</span>
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
