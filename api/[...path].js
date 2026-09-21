// Single Vercel API entry point.
// Keeping the implementation modules outside /api avoids creating one
// serverless function per endpoint and prevents Vercel Hobby's function-count
// limit from breaking deployment.

const routes = {
  admin: require('../lib/api/admin'),
  community: require('../lib/api/community'),
  'community-upload': require('../lib/api/community-upload'),
  content: require('../lib/api/content'),
  'cron-backup': require('../lib/api/cron-backup'),
  forms: require('../lib/api/forms'),
  'live-status': require('../lib/api/live-status'),
  meetings: require('../lib/api/meetings'),
  roles: require('../lib/api/roles'),
  system: require('../lib/api/system'),
  upload: require('../lib/api/upload')
};

module.exports = async (req, res) => {
  const pathname = String(req.url || '').split('?')[0].replace(/^\/+/, '');
  const parts = pathname.split('/');
  const name = parts[1] || '';
  const handler = routes[name];

  if (!handler) return res.status(404).json({ error: 'API route not found' });
  return handler(req, res);
};
