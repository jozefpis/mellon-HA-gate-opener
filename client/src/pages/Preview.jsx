import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useGate } from '../useGate.js';
import { useI18n } from '../i18n.jsx';
import { THEME_RENDERERS, VISUALS } from '../themes/registry.jsx';

// Env-gated (PREVIEW_MODE) page for eyeballing every visual — including on a
// production deployment — without a real link, a spent opening or a webhook
// call. Everything here is simulated client-side (see useGate `simulate`).
export default function Preview() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(null); // null = still checking
  const [theme, setTheme] = useState('lotr');
  const [nonce, setNonce] = useState(0); // bump to remount → replay the scene

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((c) => setEnabled(!!c.preview))
      .catch(() => setEnabled(false));
  }, []);

  if (enabled === null) {
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  // Flag off (or default) → no preview surface at all.
  if (!enabled) return <Navigate to="/admin" replace />;

  return (
    <>
      <PreviewStage key={`${theme}-${nonce}`} theme={theme} />
      <div className="preview-bar">
        <span className="preview-badge">{t('preview_badge')}</span>
        <select
          className="locale-switcher on-dark preview-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          aria-label="Visual"
        >
          {VISUALS.map((v) => (
            <option key={v.code} value={v.code}>
              {t(v.key)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="preview-replay"
          onClick={() => setNonce((n) => n + 1)}
        >
          ↻ {t('preview_replay')}
        </button>
      </div>
    </>
  );
}

function PreviewStage({ theme }) {
  const gate = useGate('__preview__', { simulate: true });
  const render = THEME_RENDERERS[theme] || THEME_RENDERERS.basic;
  return render(gate);
}
