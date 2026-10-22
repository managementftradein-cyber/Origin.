/* ==========================================================================
   YouTube auto-detect: is the church's channel live right now?
   Uses the free YouTube Data API v3 in a quota-friendly way (about 2 units per check;
   the daily free allowance is 10,000) plus the channel's public RSS feed (no quota).
   Results are cached in memory for 40 seconds and the HTTP response is cached at the
   Vercel edge for 30 seconds, so many visitors never means many YouTube calls.
   Needs ONE environment variable on Vercel:  YOUTUBE_API_KEY
   ========================================================================== */
const API = process.env.YOUTUBE_API_BASE || 'https://www.googleapis.com/youtube/v3';
const RSS = process.env.YOUTUBE_RSS_BASE || 'https://www.youtube.com/feeds/videos.xml';
const TTL = process.env.YOUTUBE_CACHE_MS !== undefined ? Number(process.env.YOUTUBE_CACHE_MS) : 40 * 1000;
const mem = { detect: {}, handle: {} };

async function yt(path, params, key, ms = 6000) {
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key })}`;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error((j.error && j.error.message) || ('YouTube API error ' + r.status));
      e.reason = (j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || ('http' + r.status);
      throw e;
    }
    return j;
  } catch (e) { if (e.name === 'AbortError') { const x = new Error('YouTube did not answer in time'); x.reason = 'timeout'; throw x; } throw e; }
  finally { clearTimeout(t); }
}

/* accepts: UCxxxxxxxxxxxxxxxxxxxxxx | @handle | https://www.youtube.com/@handle | https://www.youtube.com/channel/UC... */
function parseChannelInput(input) {
  const s = String(input || '').trim();
  if (!s) return {};
  let m = s.match(/(UC[\w-]{22})/); if (m) return { id: m[1] };
  m = s.match(/@([\w.\-]{3,30})/); if (m) return { handle: '@' + m[1] };
  return { error: 'Enter your channel as @handle, a channel link, or a channel ID that starts with UC.' };
}

async function resolveChannelId(input, key) {
  const p = parseChannelInput(input);
  if (p.id) return p.id;
  if (p.handle) {
    const c = mem.handle[p.handle]; if (c && Date.now() - c.at < 24 * 3600e3) return c.id;
    const j = await yt('channels', { part: 'id', forHandle: p.handle }, key);
    const id = j.items && j.items[0] && j.items[0].id;
    if (!id) { const e = new Error('No YouTube channel was found for ' + p.handle); e.reason = 'channelNotFound'; throw e; }
    mem.handle[p.handle] = { id, at: Date.now() }; return id;
  }
  const e = new Error(p.error || 'No channel set'); e.reason = 'badChannel'; throw e;
}

async function rssIds(channelId) {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch(`${RSS}?channel_id=${channelId}`, { signal: ctl.signal }); clearTimeout(t);
    if (!r.ok) return [];
    const xml = await r.text();
    return [...xml.matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((m) => m[1]);
  } catch (_) { return []; }
}

/* -> { live: {...}|null, last: {...}|null, checked: n } */
async function detect(channelId, key, fresh = false) {
  const hit = mem.detect[channelId];
  if (!fresh && hit && Date.now() - hit.at < TTL) return hit.value;
  const ids = new Set(); let firstErr = null;
  try {   // 1 quota unit: newest items in the channel's uploads playlist (live streams appear here)
    const pl = await yt('playlistItems', { part: 'contentDetails', playlistId: 'UU' + channelId.slice(2), maxResults: '10' }, key);
    (pl.items || []).forEach((i) => i.contentDetails && i.contentDetails.videoId && ids.add(i.contentDetails.videoId));
  } catch (e) { firstErr = e; }
  (await rssIds(channelId)).slice(0, 10).forEach((id) => ids.add(id));   // free second source
  let value = { live: null, last: null, checked: 0 };
  if (ids.size) {
    const vj = await yt('videos', { part: 'snippet,liveStreamingDetails,status', id: [...ids].slice(0, 20).join(',') }, key);  // 1 unit
    const vids = (vj.items || []).filter((v) => v.snippet && (v.snippet.channelId === channelId || !v.snippet.channelId));
    const mk = (v) => ({ id: v.id, title: v.snippet.title, description: v.snippet.description || '', embeddable: !v.status || v.status.embeddable !== false,
      startedAt: v.liveStreamingDetails && v.liveStreamingDetails.actualStartTime, endedAt: v.liveStreamingDetails && v.liveStreamingDetails.actualEndTime });
    const live = vids.filter((v) => v.snippet.liveBroadcastContent === 'live').map(mk).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0] || null;
    const last = vids.filter((v) => v.liveStreamingDetails && v.liveStreamingDetails.actualEndTime).map(mk).sort((a, b) => String(b.endedAt).localeCompare(String(a.endedAt)))[0] || null;
    value = { live, last, checked: vids.length };
  } else if (firstErr) throw firstErr;
  mem.detect[channelId] = { at: Date.now(), value };
  return value;
}

const watch = (id) => 'https://www.youtube.com/watch?v=' + id;
const clip = (s) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > 240 ? s.slice(0, 237) + '…' : s; };

/* Decide what the website should show. A manual "LIVE" switch in Admin always wins. */
async function applyAuto(row) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!row || !row.auto_enabled || !row.youtube_channel_id || !key) return { row, auto: false };
  try {
    const cid = await resolveChannelId(row.youtube_channel_id, key);
    if (row.is_live) return { row, auto: true };
    const d = await detect(cid, key);
    if (d.live) {
      return { auto: true, row: { ...row, is_live: true, title: d.live.title || row.title, description: row.description || clip(d.live.description),
        stream_url: watch(d.live.id), embed_url: '', embeddable: d.live.embeddable, source: 'youtube-auto' } };
    }
    if (d.last && Date.now() - new Date(d.last.endedAt).getTime() < 14 * 864e5) {
      return { auto: true, row: { ...row, is_live: false, title: d.last.title || row.title, description: row.description || clip(d.last.description),
        stream_url: watch(d.last.id), embed_url: '', embeddable: d.last.embeddable, source: 'youtube-auto-replay' } };
    }
    return { row, auto: true };
  } catch (e) { return { row, auto: true, error: e.reason || e.message }; }
}

function explain(e) {
  const r = (e && e.reason) || '';
  if (/keyInvalid|API key not valid|badRequest/i.test(r + ' ' + (e && e.message))) return 'The YouTube API key is not valid. Check YOUTUBE_API_KEY in Vercel.';
  if (/quota/i.test(r)) return 'The free YouTube daily allowance has been used up. It resets each day; try again later.';
  if (/accessNotConfigured|forbidden|http403/i.test(r + ' ' + (e && e.message))) return 'YouTube refused the request. Make sure "YouTube Data API v3" is enabled for the key in Google Cloud.';
  if (/channelNotFound|playlistNotFound|http404/i.test(r)) return 'That YouTube channel could not be found. Check the @handle or channel ID.';
  if (/badChannel/i.test(r)) return e.message;
  if (/timeout/i.test(r)) return 'YouTube did not answer in time. Try again.';
  return (e && e.message) || 'Could not reach YouTube.';
}

/* Admin "Test connection" */
async function diagnose(row, input) {
  const key = process.env.YOUTUBE_API_KEY;
  const channelInput = (input || (row && row.youtube_channel_id) || '').trim();
  if (!key) return { ok: false, step: 'key', message: 'No YouTube API key yet. Add YOUTUBE_API_KEY in Vercel → Settings → Environment Variables, then redeploy.' };
  if (!channelInput) return { ok: false, step: 'channel', message: 'Enter your YouTube channel (@handle or channel ID) and save first.' };
  try {
    const cid = await resolveChannelId(channelInput, key);
    const ch = await yt('channels', { part: 'snippet', id: cid }, key);
    const item = ch.items && ch.items[0];
    if (!item) { const e = new Error('No YouTube channel was found for that ID'); e.reason = 'channelNotFound'; throw e; }
    const d = await detect(cid, key, true);
    return { ok: true, channelId: cid, channelTitle: item.snippet.title, checked: d.checked,
      live: d.live ? { title: d.live.title, id: d.live.id, embeddable: d.live.embeddable } : null,
      last: d.last ? { title: d.last.title, id: d.last.id } : null };
  } catch (e) { return { ok: false, step: 'youtube', message: explain(e), reason: e.reason || '' }; }
}

module.exports = { applyAuto, diagnose, detect, resolveChannelId, parseChannelInput, explain };
