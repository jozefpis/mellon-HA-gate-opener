import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useI18n, LocaleSwitcher } from '../i18n.jsx';

export default function Admin() {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((r) => setAuthed(r.admin))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="screen admin">
        <LocaleSwitcher />
        <p className="center-msg">{t('app_loading')}</p>
      </div>
    );
  }

  return authed ? (
    <Dashboard onLogout={() => setAuthed(false)} />
  ) : (
    <Login onLogin={() => setAuthed(true)} />
  );
}

function Login({ onLogin }) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.login(password);
      onLogin();
    } catch {
      setError(t('admin_wrong_password'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen admin">
      <LocaleSwitcher />
      <h1>{t('admin_title')}</h1>
      <p className="sub">{t('admin_login_sub')}</p>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>{t('admin_password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
          />
        </div>
        <button className="btn" disabled={busy || !password}>
          {busy ? t('admin_signing_in') : t('admin_sign_in')}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const { t } = useI18n();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState('5');
  const [theme, setTheme] = useState('lotr');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setLinks(await api.listLinks());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(e) {
    e.preventDefault();
    setError('');
    const n = parseInt(maxUses, 10);
    if (!Number.isInteger(n) || n < 1) {
      setError(t('admin_invalid_count'));
      return;
    }
    setCreating(true);
    try {
      await api.createLink({ label: label.trim(), max_uses: n, theme });
      setLabel('');
      setMaxUses('5');
      await refresh();
    } catch (err) {
      setError(
        err.data?.error === 'invalid_count'
          ? t('admin_invalid_count')
          : t('admin_create_failed')
      );
    } finally {
      setCreating(false);
    }
  }

  async function logout() {
    await api.logout().catch(() => {});
    onLogout();
  }

  return (
    <div className="screen admin">
      <LocaleSwitcher />
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>{t('admin_title')}</h1>
        <button className="btn danger-ghost" onClick={logout}>
          {t('admin_logout')}
        </button>
      </div>
      <p className="sub">{t('admin_dash_sub')}</p>

      <form className="card" onSubmit={create}>
        <div className="field">
          <label>{t('admin_label_field')}</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('admin_label_placeholder')}
          />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>{t('admin_count')}</label>
            <input
              type="number"
              min="1"
              max="10000"
              inputMode="numeric"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1.4 }}>
            <label>{t('admin_theme')}</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="lotr">{t('theme_lotr')}</option>
              <option value="basic">{t('theme_basic')}</option>
            </select>
          </div>
        </div>
        <button className="btn" disabled={creating}>
          {creating ? t('admin_generating') : t('admin_generate')}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      <h2 style={{ fontSize: '1rem', color: 'var(--muted)', margin: '8px 0 12px' }}>
        {t('admin_generated_links')}
      </h2>

      {loading ? (
        <p className="center-msg">{t('app_loading')}</p>
      ) : links.length === 0 ? (
        <p className="center-msg">{t('admin_no_links')}</p>
      ) : (
        links.map((l) => <LinkItem key={l.token} link={l} onChange={refresh} />)
      )}
    </div>
  );
}

function LinkItem({ link, onChange }) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/g/${link.token}`;
  const used = link.max_uses - link.remaining;
  const exhausted = link.remaining <= 0;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore – the selected input is the fallback */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`link-item ${exhausted ? 'exhausted' : ''}`}>
      <div className="top">
        <div>
          <div className="label">{link.label || t('admin_untitled')}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {new Date(link.created_at).toLocaleString(locale)}
          </div>
        </div>
        <span className={`badge ${link.theme === 'lotr' ? 'theme-lotr' : ''}`}>
          {link.theme === 'lotr' ? t('theme_lotr') : t('theme_basic')}
        </span>
      </div>

      <div className="progress">
        <span style={{ width: `${(used / link.max_uses) * 100}%` }} />
      </div>
      <div className="link-meta">
        <span>
          {t('admin_used')}: <strong>{used}</strong> / {link.max_uses}
        </span>
        <span>
          {exhausted ? (
            <strong style={{ color: 'var(--danger)' }}>{t('admin_exhausted')}</strong>
          ) : !link.active ? (
            <strong style={{ color: 'var(--danger)' }}>{t('admin_disabled_state')}</strong>
          ) : (
            <span style={{ color: 'var(--ok)' }}>
              {t('admin_remaining_state', { n: link.remaining })}
            </span>
          )}
        </span>
      </div>

      <div className="share-row">
        <input readOnly value={url} onFocus={(e) => e.target.select()} />
        <button onClick={copy}>{copied ? t('admin_copied') : t('admin_copy')}</button>
      </div>

      <div className="row" style={{ marginTop: 10, gap: 8 }}>
        <button
          className="btn secondary"
          style={{ flex: 1, padding: '10px' }}
          onClick={() => api.setActive(link.token, !link.active).then(onChange)}
        >
          {link.active ? t('admin_disable') : t('admin_enable')}
        </button>
        <button
          className="btn danger-ghost"
          onClick={() => {
            if (confirm(t('admin_confirm_delete')))
              api.deleteLink(link.token).then(onChange);
          }}
        >
          {t('admin_delete')}
        </button>
      </div>
    </div>
  );
}
