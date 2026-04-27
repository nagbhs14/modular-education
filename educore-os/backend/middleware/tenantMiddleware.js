const db = require('../database');

const tenantMiddleware = (req, res, next) => {
  const host = req.get('host') || '';
  
  // Extract subdomain (e.g. springfield.localhost:3000 -> springfield)
  let subdomain = null;
  if (host.includes('.')) {
    subdomain = host.split('.')[0];
  }

  if (!subdomain || subdomain === 'localhost' || subdomain === 'www') {
    return res.status(400).json({ error: 'Tenant subdomain is required.' });
  }

  const tenant = db.prepare('SELECT * FROM tenants WHERE subdomain = ?').get(subdomain);

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  req.tenant = tenant; // Inject tenant context into request
  next();
};

module.exports = tenantMiddleware;
