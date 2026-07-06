async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // admin
  me: () => req('GET', '/api/admin/me'),
  login: (password) => req('POST', '/api/admin/login', { password }),
  logout: () => req('POST', '/api/admin/logout'),
  listLinks: () => req('GET', '/api/admin/links'),
  createLink: (payload) => req('POST', '/api/admin/links', payload),
  setActive: (token, active) => req('PATCH', `/api/admin/links/${token}`, { active }),
  setTheme: (token, theme) => req('PATCH', `/api/admin/links/${token}`, { theme }),
  deleteLink: (token) => req('DELETE', `/api/admin/links/${token}`),
  // public
  getLink: (token) => req('GET', `/api/link/${token}`),
  openGate: (token) => req('POST', `/api/link/${token}/open`),
};
