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

  // Fetch subscription plan details
  const planDetails = db.prepare(`
    SELECT sp.name, sp.display_name, sp.max_students, sp.max_modules, sp.price_monthly, sp.features, ts.status
    FROM tenant_subscriptions ts
    JOIN subscription_plans sp ON ts.plan_id = sp.id
    WHERE ts.tenant_id = ?
  `).get(tenant.id);

  if (planDetails) {
    try {
      planDetails.features = JSON.parse(planDetails.features);
    } catch(e) {
      planDetails.features = [];
    }
  }

  tenant.plan = planDetails || { name: 'free', max_modules: 5, features: [] };
  
  req.tenant = tenant; // Inject tenant context into request
  next();
};

module.exports = tenantMiddleware;
