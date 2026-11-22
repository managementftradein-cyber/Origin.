const crypto = require('crypto');
const { sb, requireAdmin } = require('./_supabase');

// Vercel rejects request bodies over about 4.5 MB, so large files (sermon audio, videos) must go straight to
// Supabase Storage. This returns a one-time signed upload link; the browser then uploads the file itself:
//   supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)
// Set a file-size limit and allowed MIME types on each bucket in Supabase (see sql/security_fixes.sql) because
// signed uploads bypass the checks below.
const SIGN = {
  'sermon-audio': { exts: { mp3: 'audio/mpeg', m4a: 'audio/mp4' } },
  gallery: { exts: { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm' } }
};
async function signUpload(req, res) {
  const { bucket, ext } = req.body || {};
  const cfg = Object.prototype.hasOwnProperty.call(SIGN, bucket) ? SIGN[bucket] : null;
  const e = String(ext || '').toLowerCase().replace(/^\./, '');
  if (!cfg || !Object.prototype.hasOwnProperty.call(cfg.exts, e)) return res.status(400).json({ error: 'Unsupported bucket or file type' });
  const path = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${e}`;
  const db = sb();
  const s = await db.storage.from(bucket).createSignedUploadUrl(path);
  if (s.error) throw s.error;
  const pub = db.storage.from(bucket).getPublicUrl(path);
  return res.status(200).json({ bucket, path, token: s.data.token, signedUrl: s.data.signedUrl, publicUrl: pub.data.publicUrl, contentType: cfg.exts[e] });
}

const BUCKET = 'gallery';
const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const VIDEO_MAX_BYTES = 8 * 1024 * 1024; // 8MB — keep clips short/compressed; serverless request bodies are capped low.
const ALLOWED_IMAGE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const ALLOWED_VIDEO = { 'video/mp4': 'mp4', 'video/webm': 'webm' };

function matchesImageSignature(buffer, contentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  if (contentType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (contentType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (contentType === 'image/gif') return buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (contentType === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function matchesVideoSignature(buffer, contentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  if (contentType === 'video/mp4') return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  if (contentType === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

module.exports = async (req, res) => {
  try {
    await requireAdmin(req);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (req.query && req.query.action === 'sign') return await signUpload(req, res);

    const { contentType, dataBase64, caption, category, purpose } = req.body || {};
    const isVideo = Object.prototype.hasOwnProperty.call(ALLOWED_VIDEO, contentType);
    const ext = isVideo ? ALLOWED_VIDEO[contentType] : ALLOWED_IMAGE[contentType];
    if (!ext) return res.status(400).json({ error: 'Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4 or WEBM.' });
    if (!dataBase64) return res.status(400).json({ error: 'No file data received' });

    const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    const normalizedBase64 = String(dataBase64).replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedBase64) || normalizedBase64.length > Math.ceil((maxBytes * 4) / 3) + 8) {
      return res.status(400).json({ error: `Invalid or oversized ${isVideo ? 'video' : 'image'} data` });
    }
    const buffer = Buffer.from(normalizedBase64, 'base64');
    const signatureOk = isVideo ? matchesVideoSignature(buffer, contentType) : matchesImageSignature(buffer, contentType);
    if (!signatureOk) return res.status(400).json({ error: `File data does not match the declared ${isVideo ? 'video' : 'image'} type` });
    if (buffer.length > maxBytes) return res.status(400).json({ error: `${isVideo ? 'Video' : 'Image'} is larger than ${Math.round(maxBytes / (1024 * 1024))}MB` });

    const path = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${ext}`;
    const db = sb();
    const up = await db.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
    if (up.error) throw up.error;

    const pub = db.storage.from(BUCKET).getPublicUrl(path);
    // Program flyers (purpose: 'program') are only stored and returned as a URL: they must not
    // appear in the website photo gallery / homepage slideshow.
    if (purpose === 'program' || purpose === 'welcome' || purpose === 'about') {
      return res.status(201).json({ url: pub.data.publicUrl, path });
    }
    const rec = await db.from('gallery_photos').insert({
      url: pub.data.publicUrl,
      caption: caption || '',
      category: category || 'Gallery',
      media_type: isVideo ? 'video' : 'image',
      is_active: true,
      display_order: 0
    }).select().single();
    if (rec.error) throw rec.error;
    return res.status(201).json({ url: pub.data.publicUrl, path, item: rec.data });
  } catch (e) {
    console.error(e);
    const status = e.status || 500;
    return res.status(status).json({ error: status === 500 ? 'Upload failed' : e.message });
  }
};
