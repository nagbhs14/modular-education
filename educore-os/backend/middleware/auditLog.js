const db = require('../database');

// Audit log middleware - logs every mutating action
const auditLog = (req, res, next) => {
  const originalSend = res.json.bind(res);
  
  res.json = (body) => {
    // Only log mutating requests that succeeded
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && res.statusCode < 400) {
      try {
        const stmt = db.prepare(`
          INSERT INTO audit_logs (tenant_id, user_id, action, entity, details, ip_address)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          req.tenant?.id || 0,
          req.user?.userId || null,
          `${req.method} ${req.originalUrl}`,
          req.originalUrl.split('/')[2] || 'unknown',
          JSON.stringify({ body: req.body, status: res.statusCode }),
          req.ip
        );
      } catch(err) {
        console.error('Audit log error:', err.message);
      }
    }
    return originalSend(body);
  };
  
  next();
};

module.exports = auditLog;
