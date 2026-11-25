const { sb, requireAdmin, clientIp, checkRateLimit, requireJson } = require('./_supabase');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TOKEN_RE = /^(Expo|Exponent)PushToken\[[^\]]{1,200}\]$/;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (_) { return {}; }
}

// Keep only small, simple preference values (booleans / short strings / numbers).
function cleanPrefs(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const k of Object.keys(raw).slice(0, 20)) {
    if (!/^[a-zA-Z_]{1,30}$/.test(k)) continue;
    const v = raw[k];
    if (typeof v === 'boolean' || typeof v === 'number') out[k] = v;
    else if (typeof v === 'string' && v.length <= 40) out[k] = v;
  }
  return out;
}

async function register(db, body) {
  const token = String(body.token || '').trim();
  if (!TOKEN_RE.test(token)) return { status: 400, data: { error: 'Invalid push token' } };
  const row = {
    token,
    platform: String(body.platform || '').slice(0, 20),
    app_version: String(body.appVersion || '').slice(0, 30),
    device_name: String(body.deviceName || '').slice(0, 80),
    prefs: cleanPrefs(body.prefs),
    is_active: true,
    updated_at: new Date().toISOString()
  };
  const { error } = await db.from('push_tokens').upsert(row, { onConflict: 'token' });
  if (error) throw error;
  return { status: 200, data: { ok: true } };
}

async function unregister(db, body) {
  const token = String(body.token || '').trim();
  if (!TOKEN_RE.test(token)) return { status: 400, data: { error: 'Invalid push token' } };
  const { error } = await db.from('push_tokens').update({ is_active: false, updated_at: new Date().toISOString() }).eq('token', token);
  if (error) throw error;
  return { status: 200, data: { ok: true } };
}

// Admin only. Body: { title, body, data?, onlyLive? }
async function send(db, body) {
  const title = String(body.title || '').trim().slice(0, 100);
  const text = String(body.body || '').trim().slice(0, 300);
  if (!title || !text) return { status: 400, data: { error: 'title and body are required' } };
  const extra = body.data && typeof body.data === 'object' && JSON.stringify(body.data).length < 1000 ? body.data : {};

  const q = await db.from('push_tokens').select('token,prefs').eq('is_active', true).limit(5000);
  if (q.error) throw q.error;
  let rows = q.data || [];
  if (body.onlyLive) rows = rows.filter(r => !(r.prefs && r.prefs.live === false));
  const tokens = rows.map(r => r.token).filter(t => TOKEN_RE.test(t));

  let sent = 0;
  const dead = [];
  const started = Date.now();
  for (let i = 0; i < tokens.length; i += 100) {
    if (Date.now() - started > 8000) break; // stay inside the serverless time limit; send again for the rest
    const chunk = tokens.slice(i, i + 100);
    try {
      const resp = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk.map(to => ({ to, title, body: text, sound: 'default', data: extra })))
      });
      const json = await resp.json().catch(() => ({}));
      (json.data || []).forEach((t, idx) => {
        if (t.status === 'ok') sent++;
        else if (t.details && t.details.error === 'DeviceNotRegistered') dead.push(chunk[idx]);
      });
    } catch (e) { console.error('Expo push chunk failed:', e.message); }
  }
  if (dead.length) await db.from('push_tokens').update({ is_active: false }).in('token', dead);
  return { status: 200, data: { ok: true, devices: tokens.length, sent, deactivated: dead.length } };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const action = String(req.query.action || '');
  res.setHeader('Cache-Control', 'private, no-store');
  if (!requireJson(req, res)) return;
  try {
    const db = sb();
    let out;
    if (action === 'register' || action === 'unregister') {
      // public endpoints: limit how often one network can call them
      const ok = await checkRateLimit(db, `push:${clientIp(req)}`, 30, 3600);
      if (!ok) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      const body = readBody(req);
      out = action === 'register' ? await register(db, body) : await unregister(db, body);
    } else if (action === 'send') {
      await requireAdmin(req);
      out = await send(db, readBody(req));
    } else {
      return res.status(400).json({ error: 'Unknown push action' });
    }
    return res.status(out.status).json(out.data);
  } catch (e) {
    console.error(e);
    const status = e.status || 500;
    return res.status(status).json({ error: status === 500 ? 'Push request failed' : e.message });
  }
};
