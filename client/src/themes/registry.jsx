import BasicGate from './BasicGate.jsx';
import LotrGate from './LotrGate.jsx';
import HpGate from './HpGate.jsx';

// Stargate dial-in: chevrons lock one by one, kawoosh, then a looping horizon.
const STARGATE_VIDEO = {
  intro: '/stargate-intro.mp4',
  loop: '/stargate-loop.mp4',
  poster: '/stargate-poster.jpg',
  openStill: '/stargate-open.jpg',
};

// Floo fireplace: a handful of powder, the fire roars green (simulated flames).
const FIREPLACE_VIDEO = {
  intro: '/hp-intro.mp4',
  loop: '/hp-loop.mp4',
  poster: '/hp-poster.jpg',
  openStill: '/hp-open.jpg',
};

// Alohomora: a wand unlocks the rings and the doors swing open onto golden light.
const DOOR_VIDEO = {
  intro: '/hpdoor-intro.mp4',
  loop: '/hpdoor-loop.mp4',
  poster: '/hpdoor-poster.jpg',
  openStill: '/hpdoor-open.jpg',
};

// TARDIS: the lamp flashes (vworp), the doors swing open on the console room
// and smoke rolls out over the step.
const TARDIS_VIDEO = {
  intro: '/tardis-intro.mp4',
  loop: '/tardis-loop.mp4',
  poster: '/tardis-poster.jpg',
  openStill: '/tardis-open.jpg',
};

// Opening music (Spotify): the first 30 s, which is also exactly what
// logged-out listeners get (Spotify's 30 s preview).
// HP: "Prologue" (Philosopher's Stone OST) — its preview opens right on the
// iconic celesta Hedwig's Theme, unlike the full "Hedwig's Theme" track's.
const HEDWIGS_THEME = { uri: 'spotify:track:6CeCOC2zx1qS8mQNYHe6IM', startAt: 0, stopAt: 30 };
const SG1_MAIN_TITLE = { uri: 'spotify:track:3soC3EXUG0k4uyt73fi6A7', startAt: 0, stopAt: 30 };
const DOCTOR_WHO_THEME = { uri: 'spotify:track:3npuD3aLlfd5XY9L3Yy63U', startAt: 0, stopAt: 30 };

// Each theme renders its gate component (HP scenes share HpGate with props).
// `g` is the gate state from useGate: { link, status, countdown, error, open }.
export const THEME_RENDERERS = {
  lotr: (g) => <LotrGate {...g} />,
  hp: (g) => (
    <HpGate
      {...g}
      video={FIREPLACE_VIDEO}
      music={HEDWIGS_THEME}
      tagline="hp_tagline"
      objectPosition="center 40%"
      buttonKey="hp_button"
      variant="fire"
    />
  ),
  hpdoor: (g) => (
    <HpGate
      {...g}
      video={DOOR_VIDEO}
      music={HEDWIGS_THEME}
      tagline="hpdoor_tagline"
      objectPosition="center 30%"
    />
  ),
  stargate: (g) => (
    <HpGate
      {...g}
      video={STARGATE_VIDEO}
      music={SG1_MAIN_TITLE}
      tagline="stargate_tagline"
      objectPosition="center 42%"
      buttonKey="stargate_button"
      variant="sg"
    />
  ),
  tardis: (g) => (
    <HpGate
      {...g}
      video={TARDIS_VIDEO}
      music={DOCTOR_WHO_THEME}
      tagline="tardis_tagline"
      objectPosition="center 40%"
      buttonKey="tardis_button"
      variant="tardis"
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
  { code: 'tardis', key: 'theme_tardis' },
  { code: 'basic', key: 'theme_basic' },
];
