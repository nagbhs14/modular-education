const express = require('express');
const db = require('../../database');
const { authMiddleware } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

// ─── GET inbox (messages received by current user) ───
router.get('/inbox', (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.tenant_id = ? AND m.receiver_id = ?
    ORDER BY m.created_at DESC
  `).all(req.tenant.id, req.user.userId);
  res.json(messages);
});

// ─── GET sent messages ───
router.get('/sent', (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as receiver_name
    FROM messages m
    JOIN users u ON m.receiver_id = u.id
    WHERE m.tenant_id = ? AND m.sender_id = ?
    ORDER BY m.created_at DESC
  `).all(req.tenant.id, req.user.userId);
  res.json(messages);
});

// ─── SEND a message ───
router.post('/', (req, res) => {
  const { receiver_id, subject, body } = req.body;
  if (!receiver_id || !body) return res.status(400).json({ error: 'Receiver and body required' });

  try {
    const stmt = db.prepare('INSERT INTO messages (tenant_id, sender_id, receiver_id, subject, body) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(req.tenant.id, req.user.userId, receiver_id, subject || '', body);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MARK as read ───
router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND tenant_id = ? AND receiver_id = ?')
    .run(req.params.id, req.tenant.id, req.user.userId);
  res.json({ success: true });
});

// ─── GET contacts (users the current user can message) ───
router.get('/contacts', (req, res) => {
  let contacts;
  if (req.user.role === 'student') {
    // Students can only message admin/teacher
    contacts = db.prepare(`
      SELECT id, name, role FROM users 
      WHERE tenant_id = ? AND role IN ('admin', 'teacher')
      ORDER BY name
    `).all(req.tenant.id);
  } else {
    // Admin/Teacher can message anyone
    contacts = db.prepare(`
      SELECT id, name, role FROM users 
      WHERE tenant_id = ? AND id != ?
      ORDER BY role, name
    `).all(req.tenant.id, req.user.userId);
  }
  res.json(contacts);
});

// ─── COMPLAINTS (students submit, admin views) ───
router.get('/complaints', (req, res) => {
  if (req.user.role === 'student') {
    const studentRec = db.prepare('SELECT id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
    if (!studentRec) return res.json([]);
    const list = db.prepare(`
      SELECT c.*, u.name as student_name 
      FROM complaints c 
      JOIN students s ON c.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE c.tenant_id = ? AND c.student_id = ?
      ORDER BY c.created_at DESC
    `).all(req.tenant.id, studentRec.id);
    return res.json(list);
  }
  // Admin sees all
  const list = db.prepare(`
    SELECT c.*, u.name as student_name, s.system_uid
    FROM complaints c 
    JOIN students s ON c.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE c.tenant_id = ?
    ORDER BY c.created_at DESC
  `).all(req.tenant.id);
  res.json(list);
});

router.post('/complaints', (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'Subject and body required' });

  const studentRec = db.prepare('SELECT id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
  if (!studentRec) return res.status(403).json({ error: 'Only students can submit complaints' });

  try {
    const stmt = db.prepare('INSERT INTO complaints (tenant_id, student_id, subject, body) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.tenant.id, studentRec.id, subject, body);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/complaints/:id/reply', (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ error: 'Only admin can reply' });
  const { reply, status } = req.body;
  db.prepare('UPDATE complaints SET admin_reply = ?, status = ? WHERE id = ? AND tenant_id = ?')
    .run(reply || '', status || 'resolved', req.params.id, req.tenant.id);
  res.json({ success: true });
});

module.exports = router;
