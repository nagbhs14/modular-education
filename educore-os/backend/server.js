const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./database');

// Module Routers
const { authRouter } = require('./modules/auth/routes');
const sisRouter = require('./modules/sis/routes');
const attendanceRouter = require('./modules/attendance/routes');
const communicationRouter = require('./modules/communication/routes');
const resultsRouter = require('./modules/results/routes');
const messagesRouter = require('./modules/messages/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global Middleware ───
app.use(cors());
app.use(express.json());

// ─── Tenant Middleware ───
const tenantMiddleware = (req, res, next) => {
  const host = req.get('host') || '';
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
  req.tenant = tenant;
  next();
};

// ─── API Router (Tenant-Scoped) ───
const apiRouter = express.Router();
apiRouter.use(tenantMiddleware);

// Auth (always available)
apiRouter.use('/auth', authRouter);

// Modules
apiRouter.use('/sis', sisRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/communication', communicationRouter);
apiRouter.use('/results', resultsRouter);
apiRouter.use('/messages', messagesRouter);

app.use('/api', apiRouter);

// ─── Global Endpoints (No tenant scoping) ───

// List all tenants (for landing page — returns only non-sensitive info)
app.get('/tenants', (req, res) => {
  const tenants = db.prepare('SELECT id, name, subdomain FROM tenants').all();
  res.json(tenants);
});

// Check if subdomain exists
app.get('/tenants/check/:subdomain', (req, res) => {
  const tenant = db.prepare('SELECT id, name, subdomain FROM tenants WHERE subdomain = ?').get(req.params.subdomain);
  if (tenant) return res.json(tenant);
  res.status(404).json({ error: 'Institution not found' });
});

// Register a new institution
app.post('/tenants', (req, res) => {
  const { name, subdomain, adminName, adminUsername, adminPassword } = req.body;
  if (!name || !subdomain) return res.status(400).json({ error: 'Name and subdomain required' });
  if (!adminUsername || !adminPassword) return res.status(400).json({ error: 'Admin credentials required' });

  // Sanitize subdomain
  const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanSub.length < 3) return res.status(400).json({ error: 'Subdomain must be at least 3 characters' });

  const prefix = cleanSub.substring(0, 3).toUpperCase();

  try {
    const insertTx = db.transaction(() => {
      const stmt = db.prepare("INSERT INTO tenants (name, subdomain, id_prefix) VALUES (?, ?, ?)");
      const info = stmt.run(name, cleanSub, prefix);
      const tenantId = info.lastInsertRowid;

      // Create admin user
      const insertUser = db.prepare("INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)");
      insertUser.run(tenantId, adminName || `Admin`, adminUsername, adminPassword, 'admin');

      return { id: tenantId, name, subdomain: cleanSub };
    });

    const result = insertTx();

    // Generate the student login link
    const studentLoginUrl = `http://${result.subdomain}.localhost:5173/student-login`;

    res.status(201).json({
      ...result,
      studentLoginUrl,
      adminLoginUrl: `http://${result.subdomain}.localhost:5173`
    });
  } catch(err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Subdomain already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`EduCore OS Backend running on http://localhost:${PORT}`);
});
