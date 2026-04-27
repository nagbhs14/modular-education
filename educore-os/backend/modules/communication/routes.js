const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');
const { uploadAnnouncement, getFileUrl, handleUploadError } = require('../../utils/upload');

const router = express.Router();

router.use(authMiddleware);

// Get announcements
router.get('/', (req, res) => {
    const announcements = db.prepare(`
        SELECT a.id, a.message, a.file_url, a.created_at, u.name as author
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        WHERE a.tenant_id = ?
        ORDER BY a.created_at DESC
    `).all(req.tenant.id);
    res.json(announcements);
});

// Post announcement (Admin/Teacher)
router.post('/', requireRole(['admin', 'teacher']), uploadAnnouncement.single('attachment'), (req, res) => {
    const { message } = req.body;
    const file_url = getFileUrl(req, req.file);

    try {
        const stmt = db.prepare("INSERT INTO announcements (tenant_id, message, file_url, created_by) VALUES (?, ?, ?, ?)");
        const info = stmt.run(req.tenant.id, message, file_url, req.user.userId);

        // Notify all users in this tenant
        const users = db.prepare('SELECT id FROM users WHERE tenant_id = ? AND id != ?').all(req.tenant.id, req.user.userId);
        const notifStmt = db.prepare('INSERT INTO notifications (tenant_id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)');
        users.forEach(u => {
            notifStmt.run(req.tenant.id, u.id, 'announcement', 'New Announcement', message.substring(0, 100));
        });

        res.status(201).json({ id: info.lastInsertRowid, message, file_url });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload error handler
router.use(handleUploadError);

module.exports = router;
