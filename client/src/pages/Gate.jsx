import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGate } from '../useGate.js';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import { THEME_RENDERERS, VISUALS } from '../themes/registry.jsx';

function VisualSwitcher({ value, onChange }) {
  const { t } = useI18n();
  return (
    <select
      className="locale-switcher on-dark visual-switcher"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Visual"
    >
      {VISUALS.map((v) => (
        <option key={v.code} value={v.code}>
          {t(v.key)}
        </option>
      ))}
    </select>
  );
}

export default function Gate() {
  const { token } = useParams();
  const { t, setLocale } = useI18n();
  const gate = useGate(token);
  // Per-viewer visual override for this link (persisted per token).
  const [override, setOverride] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`mellon_theme_${token}`);
    if (saved && THEME_RENDERERS[saved]) setOverride(saved);
  }, [token]);

  // If this link was created with a forced language, show it in that language.
  // (The viewer can still switch afterwards via the language selector.)
  useEffect(() => {
    if (gate.link?.locale) setLocale(gate.link.locale);
  }, [gate.link?.locale, setLocale]);

  function chooseVisual(v) {
    setOverride(v);
    localStorage.setItem(`mellon_theme_${token}`, v);
  }

  if (gate.status === 'loading') {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (gate.status === 'notfound') {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <LocaleSwitcher />
        <div className="center-msg">
          <img className="notfound-img" src="/snorlax.png" alt="" />
          <h1 style={{ fontSize: '1.3rem' }}>{t('gate_notfound_title')}</h1>
          <p>{t('gate_notfound_text')}</p>
        </div>
      </div>
    );
  }

  const activeTheme = override || gate.link?.theme;
  const render = THEME_RENDERERS[activeTheme] || THEME_RENDERERS.basic;

  return (
    <>
      {render(gate)}
      <VisualSwitcher value={activeTheme} onChange={chooseVisual} />
    </>
  );
}
