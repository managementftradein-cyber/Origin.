const { sb, tables, requireAdmin } = require('./_supabase');

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// Best-effort record of who changed what (table: admin_audit_log, see sql/security_fixes.sql). Never blocks the request.
async function audit(db, user, action, resource, recordId, details) {
  try {
    await db.from('admin_audit_log').insert({
      actor_email: user.email, action, resource,
      record_id: recordId == null ? null : String(recordId),
      details: details || null
    });
  } catch (_) { /* logging must never break the admin */ }
}

// Optional e-mail alert when bank / giving details change (a hijacked admin swapping account numbers is the worst case).
// Needs RESEND_API_KEY and RESEND_FROM in Vercel; ALERT_EMAIL is optional (defaults to the first ADMIN_EMAILS entry).
async function alertGiving(user, action, resource) {
  if (resource !== 'giving_accounts' || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return;
  const to = process.env.ALERT_EMAIL || String(process.env.ADMIN_EMAILS || '').split(',')[0].trim();
  if (!to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM, to,
        subject: 'TCC alert: giving details were changed',
        text: `${user.email} performed "${action}" on the giving accounts at ${new Date().toISOString()}.\nIf this was not you, secure the account immediately.`
      })
    });
  } catch (_) { /* best effort */ }
}

module.exports = async (req, res) => {
  try {
    const user = await requireAdmin(req);
    const resource = String(req.query.resource || '');
    // own-property check: stops keys like "constructor" / "__proto__" from slipping through
    if (!resource || !has(tables, resource)) return res.status(400).json({ error: 'Invalid resource' });
    const db = sb(), table = tables[resource];
    const single = resource === 'settings' || resource === 'live_status';

    if (req.method === 'GET') {
      let q = db.from(table).select('*');
      if (single) q = q.eq('id', 1).maybeSingle();
      else if (resource === 'gallery') q = q.order('created_at', { ascending: false }).limit(200);
      else if (resource === 'departments') q = q.order('display_order', { ascending: true }).limit(200);
      else q = q.order('created_at', { ascending: false }).limit(200);
      const x = await q; if (x.error) throw x.error;
      return res.json({ items: single ? (x.data ? [x.data] : []) : (x.data || []) });
    }

    const body = req.body || {}, id = body.id, data = body.data || {};
    if (req.method === 'POST') {
      const payload = resource === 'settings' ? { ...data, id: 1 }
        : resource === 'live_status' ? { ...data, id: 1, updated_at: new Date().toISOString() } : data;
      const x = single
        ? await db.from(table).upsert(payload, { onConflict: 'id' }).select().single()
        : await db.from(table).insert(payload).select().single();
      if (x.error) throw x.error;
      await audit(db, user, 'create', resource, x.data && x.data.id, { fields: Object.keys(data) });
      await alertGiving(user, 'create', resource);
      return res.status(201).json(x.data);
    }
    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const x = await db.from(table).update(data).eq('id', id).select().single();
      if (x.error) throw x.error;
      await audit(db, user, 'update', resource, id, { fields: Object.keys(data) });
      await alertGiving(user, 'update', resource);
      return res.json(x.data);
    }
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const x = await db.from(table).delete().eq('id', id); if (x.error) throw x.error;
      await audit(db, user, 'delete', resource, id, null);
      await alertGiving(user, 'delete', resource);
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    const status = e.status || 500;
    // only deliberate messages (auth etc.) reach the browser; database errors stay in the logs
    return res.status(status).json({ error: status === 500 ? 'Server error' : e.message });
  }
};
