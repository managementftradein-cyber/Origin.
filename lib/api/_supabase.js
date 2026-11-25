const { createClient } = require('@supabase/supabase-js');

function sb() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

const tables = {
  sermons: 'sermons', events: 'events', announcements: 'announcements',
  prayer: 'prayer_requests', prayer_requests: 'prayer_requests', visitors: 'visitors', subscribers: 'subscribers',
  giving: 'giving_records', giving_records: 'giving_records', giving_accounts: 'giving_accounts', settings: 'church_settings',
  gallery: 'gallery_photos', departments: 'departments', news: 'news', prophetic_words: 'prophetic_words', live_status: 'live_status',
  community_posts: 'community_posts', community_comments: 'community_comments', profiles: 'profiles'
};

function isAdminEmail(email) {
  const allowed = String(process.env.ADMIN_EMAILS || '')
    .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(String(email || '').toLowerCase());
}

// Resolves the Supabase session tied to the request's bearer token, without
// requiring the caller to be a listed admin. Used by the community endpoints
// so any signed-up member can post, comment and like.
async function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw Object.assign(new Error('Please sign in to continue'), { status: 401 });

  const client = sb();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error('Your session has expired. Please sign in again'), { status: 401 });

  // A suspended member's session token may stay valid for a while, so also check the profile.
  // FAIL CLOSED: if we cannot read the profile (database trouble) we do not let the request through.
  const prof = await client.from('profiles').select('is_suspended').eq('id', data.user.id).maybeSingle();
  if (prof.error) throw Object.assign(new Error('We could not verify your account right now. Please try again.'), { status: 503 });
  if (prof.data && prof.data.is_suspended) throw Object.assign(new Error('Your account has been suspended.'), { status: 403 });

  return data.user;
}

async function requireAdmin(req) {
  const user = await requireUser(req);
  // SECURITY: an admin is identified by e-mail, so the e-mail must be CONFIRMED. Otherwise someone
  // could sign up with an admin's address before the real owner and be treated as that admin.
  if (!user.email_confirmed_at && !user.confirmed_at) {
    throw Object.assign(new Error('Please confirm your email address first'), { status: 403 });
  }
  if (!isAdminEmail(user.email)) {
    throw Object.assign(new Error('You are not authorized to access the admin dashboard'), { status: 403 });
  }
  return user;
}

// Best-effort client IP for rate limiting. On Vercel the platform sets these headers itself (a visitor cannot
// overwrite them), and x-vercel-forwarded-for is the most reliable. Never use the Host header to build links.
function clientIp(req) {
  const h = req.headers || {};
  const pick = (v) => (v ? String(v).split(',')[0].trim() : '');
  return pick(h['x-vercel-forwarded-for']) || pick(h['x-real-ip']) || pick(h['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// JSON endpoints only accept application/json bodies (stops content-type confusion).
// Returns true when the request is fine; otherwise it answers 415 and returns false.
function requireJson(req, res) {
  const hasBody = req.body !== undefined && req.body !== null && req.body !== '';
  const type = String((req.headers && req.headers['content-type']) || '').toLowerCase();
  if (hasBody && !type.includes('application/json')) { res.status(415).json({ error: 'Content-Type must be application/json' }); return false; }
  if (hasBody && (typeof req.body !== 'object' || Array.isArray(req.body))) { res.status(400).json({ error: 'Invalid request body' }); return false; }
  return true;
}

// Fixed-window rate limit backed by the rate_limit_hits table.
// Returns TRUE when the request is allowed. FAILS OPEN (allows) if the check itself errors -
// e.g. the migration hasn't been run yet - so a missing migration degrades to "no rate limiting"
// instead of blocking every visitor (the old code returned false on error, which contradicted this comment).
async function checkRateLimit(db, key, limit, windowSeconds) {
  try {
    const { data, error } = await db.rpc('check_rate_limit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    if (error) { console.error('Rate limit check failed:', error.message); return true; }
    return data !== false;
  } catch (e) {
    console.error('Rate limit check error:', e.message);
    return true;
  }
}

// Simple honeypot check for public forms: a hidden field real users never
// fill in. If it has a value, the submission is almost certainly a bot.
// Returns true (silently) so we don't tip bots off with a distinct error.
function isHoneypotTripped(body) {
  return !!(body && String(body.website || body.company_website || '').trim());
}

module.exports = { sb, tables, requireAdmin, requireUser, isAdminEmail, clientIp, requireJson, checkRateLimit, isHoneypotTripped };
