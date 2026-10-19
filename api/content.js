const { sb } = require('./_supabase');

// Consolidated GET/read endpoints. Kept as separate functions internally so
// each type's query logic is unchanged from the original single-purpose
// files — only the routing (type dispatch) is new.

async function getEvents(db) {
  // Programs page: includes flyer image + display fields. If the programs_graphics migration has not
  // been run yet, those columns do not exist, so fall back to the original columns instead of failing.
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
  // total lets the site tell "no programs at all" (show built-in flyers) from "all unpublished" (show none)
  return { items: rows.filter(e => e.is_published !== false), total: rows.length };
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
  // Pastor's Library link settings live in separate columns; if the library migration has not been run
  // yet this extra query simply fails and the site uses its built-in defaults.
  let library = {};
  try {
    const l = await db.from('church_settings').select('library_enabled,library_url,library_title,library_text,library_button').eq('id', 1).maybeSingle();
    if (!l.error && l.data) library = l.data;
  } catch (_) { /* keep defaults */ }
  return {
    settings: { ...(settings.data || {}), ...library },
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
  departments: getDepartments,
  photos: getPhotos,
  news: getNews,
  'prophetic-words': getPropheticWords,
  giving: getGiving,
  'site-content': getSiteContent
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const type = String(req.query.type || '');
  const handler = HANDLERS[type];
  if (!handler) return res.status(400).json({ error: `Unknown content type: ${type}` });
  try {
    const data = await handler(sb());
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Could not load content' });
  }
};
