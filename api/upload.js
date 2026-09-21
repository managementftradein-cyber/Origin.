const { sb, requireAdmin } = require('./_supabase');

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

    const { contentType, dataBase64, caption, category } = req.body || {};
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

    const path = `${Date.now()}-${require('crypto').randomBytes(12).toString('hex')}.${ext}`;
    const db = sb();
    const up = await db.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
    if (up.error) throw up.error;

    const pub = db.storage.from(BUCKET).getPublicUrl(path);
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
    return res.status(e.status || 500).json({ error: e.message || 'Upload failed' });
  }
};
