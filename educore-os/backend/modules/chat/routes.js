const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

// ─── GET messages (DM or class) ───
router.get('/', (req, res) => {
  const { with_user, class_id } = req.query;

  if (class_id) {
    // Class discussion thread
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.tenant_id = ? AND m.class_id = ? AND m.is_class_message = 1
      ORDER BY m.created_at ASC
      LIMIT 100
    `).all(req.tenant.id, class_id);
    return res.json(messages);
  }

  if (with_user) {
    // DM thread
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.tenant_id = ? AND m.is_class_message = 0
        AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
      ORDER BY m.created_at ASC
      LIMIT 100
    `).all(req.tenant.id, req.user.userId, parseInt(with_user), parseInt(with_user), req.user.userId);
    return res.json(messages);
  }

  res.status(400).json({ error: 'Provide with_user or class_id query param' });
});

// ─── SEND message ───
router.post('/', (req, res) => {
  const { message, receiver_id, class_id, is_class_message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const stmt = db.prepare('INSERT INTO chat_messages (tenant_id, sender_id, receiver_id, class_id, message, is_class_message) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.tenant.id, req.user.userId, receiver_id || null, class_id || null, message, is_class_message ? 1 : 0);

    // Notify receiver
    if (receiver_id && !is_class_message) {
      db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
        .run(req.tenant.id, receiver_id, 'chat', 'New Message', `${req.user.name}: ${message.substring(0, 50)}`);
    }

    res.status(201).json({ id: info.lastInsertRowid });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET chat contacts (users in same tenant) ───
router.get('/contacts', (req, res) => {
  const contacts = db.prepare(`
    SELECT id, name, role FROM users 
    WHERE tenant_id = ? AND id != ?
    ORDER BY role, name
  `).all(req.tenant.id, req.user.userId);
  res.json(contacts);
});

// ─── NOTIFICATIONS ───
router.get('/notifications', (req, res) => {
  const notifs = db.prepare(`
    SELECT * FROM notifications
    WHERE tenant_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.tenant.id, req.user.userId);
  res.json(notifs);
});

router.put('/notifications/read', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE tenant_id = ? AND user_id = ?').run(req.tenant.id, req.user.userId);
  res.json({ success: true });
});

module.exports = router;
