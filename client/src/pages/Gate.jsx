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

export default function Gate() {
  const { token } = useParams();
  const { t } = useI18n();
  const gate = useGate(token);

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

  const render = THEME_RENDERERS[gate.link?.theme] || THEME_RENDERERS.basic;
  return render(gate);
}
