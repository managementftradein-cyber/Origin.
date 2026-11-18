const { sb, requireAdmin } = require('./_supabase');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TOKEN_RE = /^(Expo|Exponent)PushToken\[[^\]]+\]$/;

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (_) { return {}; }
}

async function register(db, body) {
  const token = String(body.token || '').trim();
  if (!TOKEN_RE.test(token)) return { status: 400, data: { error: 'Invalid push token' } };

  const row = {
    token,
    platform: String(body.platform || '').slice(0, 20),
    app_version: String(body.appVersion || '').slice(0, 30),
    device_name: String(body.deviceName || '').slice(0, 80),
    prefs: body.prefs && typeof body.prefs === 'object' ? body.prefs : {},
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

// Admin only. Body: { title, body, data?, onlyLive? }  (onlyLive skips devices whose prefs.live === false)
async function send(db, body) {
  const title = String(body.title || '').trim();
  const text = String(body.body || '').trim();
  if (!title || !text) return { status: 400, data: { error: 'title and body are required' } };

  const q = await db.from('push_tokens').select('token,prefs').eq('is_active', true).limit(5000);
  if (q.error) throw q.error;

  let rows = q.data || [];
  if (body.onlyLive) rows = rows.filter(r => !(r.prefs && r.prefs.live === false));
  const tokens = rows.map(r => r.token).filter(t => TOKEN_RE.test(t));

  let sent = 0;
  const dead = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const chunk = tokens.slice(i, i + 100);
    const messages = chunk.map(to => ({ to, title, body: text, sound: 'default', data: body.data || {} }));
    const resp = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages)
    });
    const json = await resp.json().catch(() => ({}));
    (json.data || []).forEach((t, idx) => {
      if (t.status === 'ok') sent++;
      else if (t.details && t.details.error === 'DeviceNotRegistered') dead.push(chunk[idx]);
    });
  }
  if (dead.length) await db.from('push_tokens').update({ is_active: false }).in('token', dead);

  return { status: 200, data: { ok: true, devices: tokens.length, sent, deactivated: dead.length } };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = String(req.query.action || '');
  try {
    const body = readBody(req);
    let out;
    if (action === 'register') out = await register(sb(), body);
    else if (action === 'unregister') out = await unregister(sb(), body);
    else if (action === 'send') { await requireAdmin(req); out = await send(sb(), body); }
    else return res.status(400).json({ error: `Unknown push action: ${action}` });
    return res.status(out.status).json(out.data);
  } catch (e) {
    console.error(e);
    return res.status(e.status || 500).json({ error: e.message || 'Push request failed' });
  }
};
