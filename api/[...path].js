// Single Vercel API entry point.
// Keeping the implementation modules outside /api avoids creating one serverless function per endpoint and
// prevents Vercel Hobby's function-count limit from breaking deployment.

const routes = {
  admin: require('../lib/api/admin'),
  community: require('../lib/api/community'),
  'community-upload': require('../lib/api/community-upload'),
  content: require('../lib/api/content'),
  sermons: require('../lib/api/content'),
  'cron-backup': require('../lib/api/cron-backup'),
  forms: require('../lib/api/forms'),
  'live-status': require('../lib/api/live-status'),
  meetings: require('../lib/api/meetings'),
  push: require('../lib/api/push'),
  roles: require('../lib/api/roles'),
  system: require('../lib/api/system'),
  upload: require('../lib/api/upload')
};

module.exports = async (req, res) => {
  try {
    const pathname = String(req.url || '').split('?')[0].replace(/^\/+/, '');
    const name = pathname.split('/')[1] || '';
    // SECURITY: own-property check. Without it, /api/constructor or /api/toString picked up built-in object functions,
    // never sent a response and held the request open until the 30 s timeout.
    if (!Object.prototype.hasOwnProperty.call(routes, name)) return res.status(404).json({ error: 'API route not found' });
    return await routes[name](req, res);
  } catch (e) {
    console.error('API router error:', e);
    if (!res.headersSent) return res.status(500).json({ error: 'Server error' });
  }
};
