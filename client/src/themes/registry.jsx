import BasicGate from './BasicGate.jsx';
import LotrGate from './LotrGate.jsx';
import HpGate from './HpGate.jsx';

// Each theme renders its gate component (HP scenes share HpGate with props).
// `g` is the gate state from useGate: { link, status, countdown, error, open }.
export const THEME_RENDERERS = {
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
  stargate: (g) => (
    <HpGate
      {...g}
      idle="/star-gate.png"
      active="/star-gate-activated.png"
      tagline="stargate_tagline"
      objectPosition="center 42%"
      buttonKey="stargate_button"
      variant="sg"
    />
  ),
  basic: (g) => <BasicGate {...g} />,
};

// Visuals the viewer can switch between (link page + preview).
export const VISUALS = [
  { code: 'lotr', key: 'theme_lotr' },
  { code: 'hpdoor', key: 'theme_hpdoor' },
  { code: 'hp', key: 'theme_hp' },
  { code: 'stargate', key: 'theme_stargate' },
  { code: 'basic', key: 'theme_basic' },
];
