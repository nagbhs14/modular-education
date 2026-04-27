const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

// Middleware
const tenantMiddleware = require('./middleware/tenantMiddleware');
const moduleGuard = require('./middleware/moduleGuard');
const auditLog = require('./middleware/auditLog');

// Upload error handler
const { handleUploadError } = require('./utils/upload');

// Module Routers
const { authRouter } = require('./modules/auth/routes');
const sisRouter = require('./modules/sis/routes');
const settingsRouter = require('./modules/settings/routes');
const attendanceRouter = require('./modules/attendance/routes');
const assignmentsRouter = require('./modules/assignments/routes');
const materialsRouter = require('./modules/materials/routes');
const resultsRouter = require('./modules/results/routes');
const communicationRouter = require('./modules/communication/routes');
const feesRouter = require('./modules/fees/routes');
const chatRouter = require('./modules/chat/routes');
const analyticsRouter = require('./modules/analytics/routes');
const aiRouter = require('./modules/ai/routes');
const marketplaceRouter = require('./modules/marketplace/routes');

const db = require('./database');
const fileStorage = require('./utils/fileStorage');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io for real-time chat & notifications
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in routes
app.set('io', io);

// ─── Global Middleware ───
app.use(cors());
app.use(express.json());

// ─── Tenant-Scoped Static File Serving ───
// Serve uploads with tenant isolation validation
app.use('/uploads', (req, res, next) => {
  // The URL path will be like /uploads/1/assignments/filename.pdf
  // Extract tenant ID from the path
  const urlParts = req.path.split('/').filter(Boolean);
  
  if (urlParts.length < 2) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Serve the file statically
  const filePath = path.join(__dirname, 'uploads', req.path);
  const normalizedPath = path.normalize(filePath);
  
  // Prevent directory traversal
  if (!normalizedPath.startsWith(path.normalize(path.join(__dirname, 'uploads')))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}, express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 500,                   // limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// ─── API Router (Tenant-Scoped) ───
const apiRouter = express.Router();
apiRouter.use(tenantMiddleware);
apiRouter.use(auditLog);

// Dashboard
apiRouter.get('/dashboard', (req, res) => {
  res.json({
    message: `Welcome to ${req.tenant.name} (${req.tenant.subdomain})`,
    activeModules: req.tenant.active_modules ? req.tenant.active_modules.split(',') : []
  });
});

// Auth (always available)
apiRouter.use('/auth', authRouter);

// Modules with guards
apiRouter.use('/settings', moduleGuard('settings'), settingsRouter);
apiRouter.use('/sis', moduleGuard('sis'), sisRouter);
apiRouter.use('/attendance', moduleGuard('attendance'), attendanceRouter);
apiRouter.use('/assignments', moduleGuard('assignments'), assignmentsRouter);
apiRouter.use('/materials', moduleGuard('materials'), materialsRouter);
apiRouter.use('/results', moduleGuard('results'), resultsRouter);
apiRouter.use('/communication', moduleGuard('communication'), communicationRouter);
apiRouter.use('/fees', moduleGuard('fees'), feesRouter);
apiRouter.use('/chat', moduleGuard('chat'), chatRouter);
apiRouter.use('/analytics', moduleGuard('analytics'), analyticsRouter);
apiRouter.use('/ai', moduleGuard('ai'), aiRouter);
apiRouter.use('/marketplace', marketplaceRouter); // Marketplace always available to admin

// ─── Upload error handler ───
apiRouter.use(handleUploadError);

app.use('/api', apiRouter);

// ─── Global Endpoints (No tenant scoping) ───
app.get('/tenants', (req, res) => {
  const tenants = db.prepare('SELECT id, name, subdomain FROM tenants').all();
  res.json(tenants);
});

app.post('/tenants', (req, res) => {
  const { name, subdomain } = req.body;
  if (!name || !subdomain) return res.status(400).json({ error: 'Name and subdomain required' });

  try {
    const stmt = db.prepare("INSERT INTO tenants (name, subdomain) VALUES (?, ?)");
    const info = stmt.run(name, subdomain);

    const insertUser = db.prepare("INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)");
    insertUser.run(info.lastInsertRowid, `Admin of ${name}`, 'admin', 'password', 'admin');

    // Assign free plan
    db.prepare('INSERT INTO tenant_subscriptions (tenant_id, plan_id) VALUES (?, 1)').run(info.lastInsertRowid);

    res.status(201).json({ id: info.lastInsertRowid, name, subdomain });
  } catch(err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Subdomain already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── Socket.io Real-Time ───
io.on('connection', (socket) => {
  socket.on('join', ({ tenantId, userId }) => {
    socket.join(`tenant_${tenantId}`);
    socket.join(`user_${userId}`);
  });

  socket.on('send_message', (data) => {
    if (data.is_class_message) {
      io.to(`tenant_${data.tenantId}`).emit('new_message', data);
    } else if (data.receiverId) {
      io.to(`user_${data.receiverId}`).emit('new_message', data);
    }
  });
});

// ─── Notification Emitter Utility ───
function emitNotification(tenantId, userId, data) {
  io.to(`user_${userId}`).emit('notification', data);
  io.to(`tenant_${tenantId}`).emit('tenant_notification', data);
}
app.set('emitNotification', emitNotification);

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ───
server.listen(PORT, () => {
  console.log(`EduCore OS Backend running on http://localhost:${PORT}`);
});
