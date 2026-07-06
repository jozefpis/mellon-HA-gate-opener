import crypto from 'node:crypto';

const COOKIE_NAME = 'mellon_admin';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SECRET =
  process.env.SESSION_SECRET ||
  // local-dev fallback — in production ALWAYS set SESSION_SECRET in .env
  'dev-insecure-secret-change-me';

if (!process.env.SESSION_SECRET) {
  console.warn('[auth] SESSION_SECRET is not set — using an insecure fallback (dev only).');
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${mac}`;
}

function verify(cookie) {
  if (!cookie || typeof cookie !== 'string' || !cookie.includes('.')) return null;
  const [data, mac] = cookie.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  // timing-safe comparison
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || 'mellon';
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('[auth] ADMIN_PASSWORD is not set — using the default "mellon" (change it in .env).');
  }
  if (typeof password !== 'string' || password.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

export function issueCookie(res) {
  const token = sign({ admin: true, exp: Date.now() + MAX_AGE_MS });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function requireAdmin(req, res, next) {
  const payload = verify(req.cookies?.[COOKIE_NAME]);
  if (!payload?.admin) return res.status(401).json({ error: 'unauthorized' });
  next();
}

export function isAdmin(req) {
  return !!verify(req.cookies?.[COOKIE_NAME])?.admin;
}
