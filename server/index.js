import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import db from './db.js';
import {
  checkPassword,
  issueCookie,
  clearCookie,
  requireAdmin,
  isAdmin,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const HA_WEBHOOK_URL = process.env.HA_WEBHOOK_URL || '';
const HA_WEBHOOK_METHOD = (process.env.HA_WEBHOOK_METHOD || 'POST').toUpperCase();
// Optional query string appended to the webhook URL (verbatim, without a
// leading '?'), e.g. "dev123" or "token=dev123". Use it if the Home Assistant
// automation verifies a query parameter (e.g. `{{ 'dev123' in trigger.query }}`).
// If empty, the webhook is called without any query — assumes HA verifies none.
const HA_WEBHOOK_QUERY = (process.env.HA_WEBHOOK_QUERY || '').replace(/^\?/, '');
const THEMES = ['basic', 'lotr', 'hp', 'hpdoor', 'stargate'];

// Supported UI locales; must match the codes in client/src/i18n.jsx.
const LOCALES = ['en', 'es', 'de', 'sk', 'cs', 'pl', 'zh', 'ja', 'hu'];
const DEFAULT_LOCALE = LOCALES.includes(process.env.DEFAULT_LOCALE)
  ? process.env.DEFAULT_LOCALE
  : 'en';

app.set('trust proxy', 1); // behind a reverse proxy (CapRover / Traefik / nginx)
app.use(express.json());
app.use(cookieParser());

// ---- Helpers -------------------------------------------------------------

function publicLink(row) {
  return {
    token: row.token,
    label: row.label,
    theme: row.theme,
    remaining: Math.max(0, row.max_uses - row.used_count),
    max_uses: row.max_uses,
    active: !!row.active,
  };
}

async function callWebhook() {
  if (!HA_WEBHOOK_URL) {
    console.warn('[webhook] HA_WEBHOOK_URL is not set — simulating a successful open.');
    return true; // in dev without Home Assistant we just simulate success
  }
  const target = HA_WEBHOOK_QUERY
    ? HA_WEBHOOK_URL + (HA_WEBHOOK_URL.includes('?') ? '&' : '?') + HA_WEBHOOK_QUERY
    : HA_WEBHOOK_URL;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(target, {
      method: HA_WEBHOOK_METHOD,
      headers: { 'Content-Type': 'application/json' },
      body: HA_WEBHOOK_METHOD === 'GET' ? undefined : JSON.stringify({ source: 'mellon' }),
      signal: controller.signal,
    });
    return res.ok;
  } catch (err) {
    console.error('[webhook] request failed:', err.message);
    return false;
  } finally {
    clearTimeout(t);
  }
}

// ---- Public config (read by the client on load) --------------------------

app.get('/api/config', (req, res) => {
  res.json({ defaultLocale: DEFAULT_LOCALE, locales: LOCALES });
});

// ---- Health check ---------------------------------------------------------

app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// ---- Admin API -----------------------------------------------------------

app.post('/api/admin/login', (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: 'wrong_password' });
  }
  issueCookie(res);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  clearCookie(res);
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => {
  res.json({ admin: isAdmin(req) });
});

app.get('/api/admin/links', requireAdmin, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM links ORDER BY created_at DESC')
    .all();
  res.json(
    rows.map((r) => ({
      ...publicLink(r),
      used_count: r.used_count,
      created_at: r.created_at,
    }))
  );
});

app.post('/api/admin/links', requireAdmin, (req, res) => {
  const label = String(req.body?.label ?? '').slice(0, 120);
  const theme = THEMES.includes(req.body?.theme) ? req.body.theme : 'basic';
  const maxUses = parseInt(req.body?.max_uses, 10);

  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 10000) {
    return res.status(400).json({ error: 'invalid_count' });
  }

  const token = nanoid(12);
  db.prepare(
    `INSERT INTO links (token, label, theme, max_uses, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(token, label, theme, maxUses, new Date().toISOString());

  const row = db.prepare('SELECT * FROM links WHERE token = ?').get(token);
  res.status(201).json({ ...publicLink(row), used_count: row.used_count, created_at: row.created_at });
});

// update a link: enable/disable (active) and/or change the visual (theme)
app.patch('/api/admin/links/:token', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM links WHERE token = ?').get(req.params.token);
  if (!row) return res.status(404).json({ error: 'not_found' });

  const active = typeof req.body?.active === 'boolean' ? (req.body.active ? 1 : 0) : row.active;
  const theme = THEMES.includes(req.body?.theme) ? req.body.theme : row.theme;
  const label = typeof req.body?.label === 'string' ? req.body.label.slice(0, 120) : row.label;

  db.prepare('UPDATE links SET active = ?, theme = ?, label = ? WHERE token = ?').run(
    active,
    theme,
    label,
    req.params.token
  );
  const updated = db.prepare('SELECT * FROM links WHERE token = ?').get(req.params.token);
  res.json({ ...publicLink(updated), used_count: updated.used_count, created_at: updated.created_at });
});

app.delete('/api/admin/links/:token', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM links WHERE token = ?').run(req.params.token);
  db.prepare('DELETE FROM openings WHERE token = ?').run(req.params.token);
  res.json({ ok: true });
});

// ---- Public API (the gate-opening link) ----------------------------------

app.get('/api/link/:token', (req, res) => {
  const row = db.prepare('SELECT * FROM links WHERE token = ?').get(req.params.token);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(publicLink(row));
});

// Atomically reserve one opening, then call the webhook.
const reserveStmt = db.prepare(
  `UPDATE links SET used_count = used_count + 1
   WHERE token = ? AND active = 1 AND used_count < max_uses`
);
const refundStmt = db.prepare(
  `UPDATE links SET used_count = used_count - 1 WHERE token = ?`
);

app.post('/api/link/:token/open', async (req, res) => {
  const { token } = req.params;
  const row = db.prepare('SELECT * FROM links WHERE token = ?').get(token);
  if (!row) return res.status(404).json({ error: 'not_found' });

  // Atomic slot reservation — prevents exceeding the limit even under
  // concurrent clicks.
  const info = reserveStmt.run(token);
  if (info.changes === 0) {
    const fresh = db.prepare('SELECT * FROM links WHERE token = ?').get(token);
    if (!fresh.active) return res.status(403).json({ error: 'disabled' });
    return res.status(409).json({ error: 'limit_reached', ...publicLink(fresh) });
  }

  const ok = await callWebhook();
  if (!ok) {
    // webhook failed -> release the reserved slot so it isn't wasted
    refundStmt.run(token);
    const fresh = db.prepare('SELECT * FROM links WHERE token = ?').get(token);
    return res.status(502).json({ error: 'webhook_failed', ...publicLink(fresh) });
  }

  db.prepare(
    'INSERT INTO openings (token, created_at, ip, success) VALUES (?, ?, ?, 1)'
  ).run(token, new Date().toISOString(), req.ip);

  const fresh = db.prepare('SELECT * FROM links WHERE token = ?').get(token);
  res.json({ ok: true, ...publicLink(fresh) });
});

// ---- Serve the static React build ----------------------------------------

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback (Express 4 — avoid '*' so we don't hit path-to-regexp)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mellon is running on port ${PORT}`);
});
