const { sb } = require('./_supabase');

// Consolidated GET/read endpoints (events, sermons, giving, site-content ...).
// Used by BOTH /api/content?type=... and direct paths such as /api/sermons.
// api/content.js should simply be:   module.exports = require('../lib/api/content');

// Only ever pass web links through to the apps (blocks javascript:, data:, file: ...).
const safeUrl = (v) => {
  const s = v == null ? '' : String(v).trim();
  return /^https?:\/\//i.test(s) ? s : null;
};
const clean = (v) => (v == null ? null : (String(v).trim() || null));

async function getEvents(db) {
  let q = await db.from('events')
    .select('id,title,date,location,description,image_url,date_label,display_order,is_published')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('date', { ascending: true })
    .limit(60);
  if (q.error && /column|does not exist|schema cache/i.test(q.error.message || '')) {
    q = await db.from('events').select('id,title,date,location,description').order('date', { ascending: true }).limit(30);
  }
  if (q.error) throw q.error;
  const rows = q.data || [];
  return { items: rows.filter(e => e.is_published !== false), total: rows.length };
}

async function getSermons(db) {
  const q = await db.from('sermons').select('*').limit(300);
  if (q.error) throw q.error;
  const hidden = (r) =>
    r.is_published === false || r.published === false || r.is_active === false ||
    ['draft', 'unpublished', 'hidden', 'archived'].includes(String(r.status || '').toLowerCase());

  const items = (q.data || [])
    .filter((r) => !hidden(r))
    .map((r) => ({
      id: r.id,
      title: clean(r.title) || 'Untitled message',
      speaker: clean(r.speaker || r.preacher || r.minister),
      date: r.date || r.sermon_date || null,
      video_url: safeUrl(r.video_url || r.youtube_url || r.url),
      audio_url: safeUrl(r.audio_url),
      audio_seconds: Number.isFinite(Number(r.audio_seconds)) && Number(r.audio_seconds) > 0 ? Math.round(Number(r.audio_seconds)) : null,
      description: clean(r.description || r.summary),
      created_at: r.created_at || null
    }))
    .sort((a, b) => (Date.parse(b.date || b.created_at || '') || 0) - (Date.parse(a.date || a.created_at || '') || 0));
  return { items };
}

async function getDepartments(db) {
  const q = await db.from('departments').select('id,name,description,icon,contact_email').eq('is_active', true).order('display_order', { ascending: true }).limit(30);
  if (q.error) throw q.error;
  return { items: q.data || [] };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function getPhotos(db) {
  const q = await db.from('gallery_photos').select('id,url,caption,category,media_type').eq('is_active', true).order('display_order', { ascending: true }).limit(60);
  if (q.error) throw q.error;
  return { items: shuffle(q.data || []) };
}

async function getNews(db) {
  const q = await db.from('news').select('*').eq('published', true).order('created_at', { ascending: false });
  if (q.error) throw q.error;
  return { items: q.data || [] };
}

async function getPropheticWords(db) {
  const q = await db.from('prophetic_words').select('*').eq('published', true).order('created_at', { ascending: false });
  if (q.error) throw q.error;
  return { items: q.data || [] };
}

async function getSiteContent(db) {
  const settings = await db.from('church_settings')
    .select('church_name,email,phone,location,service_times,about_label,about_heading,about_body,about_quote,about_image_url,hero_eyebrow,hero_title,hero_body,hero_interval_seconds,map_url,facebook_url,instagram_url,youtube_url,spotify_url,launch_enabled,launch_date,launch_title,launch_subtitle,launch_complete_title,launch_complete_body,launch_timezone')
    .eq('id', 1).maybeSingle();
  if (settings.error) throw settings.error;
  const photos = await db.from('gallery_photos').select('id,url,caption,category,media_type,display_order,is_active').eq('is_active', true).order('display_order', { ascending: true }).limit(100);
  if (photos.error) throw photos.error;
  const items = photos.data || [];
  const hero = items.filter(x => String(x.category || '').toLowerCase() === 'hero');
  let library = {};
  try {
    const l = await db.from('church_settings').select('library_enabled,library_url,library_title,library_text,library_button').eq('id', 1).maybeSingle();
    if (!l.error && l.data) library = l.data;
  } catch (_) { /* keep defaults */ }
  let welcome = {};
  try {
    const w = await db.from('church_settings').select('welcome_enabled,welcome_photo_url,welcome_photo_mode,welcome_title,welcome_love,welcome_button,welcome_hours').eq('id', 1).maybeSingle();
    if (!w.error && w.data) welcome = w.data;
  } catch (_) { /* keep defaults */ }
  return {
    settings: { ...(settings.data || {}), ...library, ...welcome },
    hero: (hero.length ? hero : items.slice(0, 3)).slice(0, 12),
    gallery: items.filter(x => String(x.category || '').toLowerCase() !== 'hero')
  };
}

async function getGiving(db) {
  const q = await db.from('giving_accounts')
    .select('id,label,bank_name,account_name,account_number,sort_code,instructions,currency,display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(30);
  if (q.error) throw q.error;
  return { items: q.data || [] };
}

const HANDLERS = {
  events: getEvents,
  sermons: getSermons,
  departments: getDepartments,
  photos: getPhotos,
  news: getNews,
  'prophetic-words': getPropheticWords,
  giving: getGiving,
  'site-content': getSiteContent
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const fromPath = (String(req.url || '').match(/^\/api\/([^/?]+)/) || [])[1];
  const type = String(req.query.type || fromPath || '');
  const handler = HANDLERS[type];
  if (!handler) return res.status(400).json({ error: 'Unknown content type' });

  try {
    const data = await handler(sb());
    // short shared cache: faster for everyone and protects the database from floods.
    // (admin edits show up within about a minute)
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.json(data);
  } catch (e) {
    console.error('content error:', type, e); // details stay in the Vercel logs only
    return res.status(500).json({ error: 'Could not load content' });
  }
};
