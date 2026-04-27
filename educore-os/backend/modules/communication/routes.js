const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

// Get announcements
router.get('/', (req, res) => {
    const announcements = db.prepare(`
        SELECT a.id, a.message, a.created_at, u.name as author
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        WHERE a.tenant_id = ?
        ORDER BY a.created_at DESC
    `).all(req.tenant.id);
    res.json(announcements);
});

// Post announcement (Admin/Teacher)
router.post('/', requireRole(['admin', 'teacher']), (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    try {
        const stmt = db.prepare("INSERT INTO announcements (tenant_id, message, created_by) VALUES (?, ?, ?)");
        const info = stmt.run(req.tenant.id, message, req.user.userId);
        res.status(201).json({ id: info.lastInsertRowid, message });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
