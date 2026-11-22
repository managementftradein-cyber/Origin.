const { sb, clientIp, checkRateLimit, isHoneypotTripped } = require('./_supabase');

// Consolidated public POST endpoints. Each handler's logic (validation,
// tables touched, response shape) is unchanged from the original files —
// only the routing (type dispatch) plus honeypot/rate-limit checks are new.

// Input limits: stop huge submissions from filling the database.
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const EMAIL_RE = /^\S+@\S+\.\S+$/;

async function handleContact(db, body) {
  const name = clip(body.name, 120), email = clip(body.email, 254), phone = clip(body.phone, 40), message = clip(body.message, 4000);
  if (!name || !message) {
    const err = new Error('Name and message are required');
    err.status = 400;
    throw err;
  }
  const settings = await db.from('church_settings').select('store_visitor_data').eq('id', 1).maybeSingle();
  const store = settings.error || !settings.data ? true : settings.data.store_visitor_data !== false;
  if (store) {
    const q = await db.from('visitors').insert({
      name,
      email: email && EMAIL_RE.test(email) ? email : null,
      phone: phone || null,
      message
    });
    if (q.error) throw q.error;
  }
  return { status: 200, body: { ok: true, stored: store } };
}

async function handleSubscribe(db, body) {
  const email = clip(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    const err = new Error('Valid email required');
    err.status = 400;
    throw err;
  }
  const s = await db.from('church_settings').select('store_visitor_data').eq('id', 1).maybeSingle();
  const store = s.error || !s.data ? true : s.data.store_visitor_data !== false;
  if (store) {
    const q = await db.from('subscribers').upsert({ email }, { onConflict: 'email' });
    if (q.error) throw q.error;
  }
  return { status: 200, body: { ok: true, stored: store } };
}

async function handlePrayerRequest(db, body) {
  const text = clip(body.request || body.message, 4000);
  if (!text) {
    const err = new Error('Please enter your prayer request before submitting.');
    err.status = 400;
    throw err;
  }
  const q = await db.from('prayer_requests').insert({
    name: clip(body.name, 120) || null,
    email: clip(body.email, 254) || null,
    subject: clip(body.subject, 120) || 'Prophetic Room',
    message: text
  });
  if (q.error) throw q.error;
  return { status: 201, body: { ok: true } };
}

const HANDLERS = {
  contact: handleContact,
  subscribe: handleSubscribe,
  'prayer-requests': handlePrayerRequest
};

// Requests per IP per window, per form. Generous enough for a real visitor
// filling the form a couple of times, tight enough to stop scripted spam.
const LIMITS = {
  contact: { limit: 5, windowSeconds: 600 },
  subscribe: { limit: 8, windowSeconds: 3600 },
  'prayer-requests': { limit: 5, windowSeconds: 600 }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const type = String(req.query.type || '');
  const handler = HANDLERS[type];
  if (!handler) return res.status(400).json({ error: 'Unknown form type' });

  const body = req.body || {};
  // Silently "succeed" on honeypot trips so scripts don't learn they were caught.
  if (isHoneypotTripped(body)) return res.status(200).json({ ok: true });

  try {
    const db = sb();
    const rl = LIMITS[type];
    if (rl) {
      const ok = await checkRateLimit(db, `forms:${type}:${clientIp(req)}`, rl.limit, rl.windowSeconds);
      if (!ok) return res.status(429).json({ error: 'Too many submissions. Please wait a few minutes and try again.' });
    }
    const result = await handler(db, body);
    return res.status(result.status).json(result.body);
  } catch (e) {
    console.error(e);
    const status = e.status || 500;
    // database error text stays in the logs; visitors only see our own messages
    return res.status(status).json({ error: status === 500 ? 'Could not submit the form. Please try again.' : e.message });
  }
};
