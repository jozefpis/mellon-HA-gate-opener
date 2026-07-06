import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGate } from '../useGate.js';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';
import BasicGate from '../themes/BasicGate.jsx';
import LotrGate from '../themes/LotrGate.jsx';
import HpGate from '../themes/HpGate.jsx';

// Each theme renders its gate component (HP scenes share HpGate with props).
const THEME_RENDERERS = {
  lotr: (g) => <LotrGate {...g} />,
  hp: (g) => (
    <HpGate
      {...g}
      idle="/harry-potter.png"
      active="/harry-potter-activated.png"
      tagline="hp_tagline"
      objectPosition="center 40%"
      buttonKey="hp_button"
    />
  ),
  hpdoor: (g) => (
    <HpGate
      {...g}
      idle="/harry-potter-1.png"
      active="/harry-potter-1-activated.png"
      tagline="hpdoor_tagline"
      objectPosition="center 30%"
    />
  ),
  basic: (g) => <BasicGate {...g} />,
};

// Visuals the viewer can switch between on the link page.
const VISUALS = [
  { code: 'lotr', key: 'theme_lotr' },
  { code: 'hpdoor', key: 'theme_hpdoor' },
  { code: 'hp', key: 'theme_hp' },
  { code: 'basic', key: 'theme_basic' },
];

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
  const { t } = useI18n();
  const gate = useGate(token);
  // Per-viewer visual override for this link (persisted per token).
  const [override, setOverride] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`mellon_theme_${token}`);
    if (saved && THEME_RENDERERS[saved]) setOverride(saved);
  }, [token]);

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
