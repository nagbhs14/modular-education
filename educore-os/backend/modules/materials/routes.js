const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');
const { uploadMaterial, getFileUrl, handleUploadError } = require('../../utils/upload');

const router = express.Router();

router.use(authMiddleware);

// Get All Study Materials
router.get('/', (req, res) => {
    let materials;
    if (req.user.role === 'student') {
        // Students see materials for their class or all-class materials
        const student = db.prepare('SELECT class_id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
        materials = db.prepare(`
            SELECT m.id, m.title, m.description, m.file_url, m.class_id, m.created_at, u.name as teacher_name, c.name as class_name
            FROM materials m
            JOIN users u ON m.created_by = u.id
            LEFT JOIN classes c ON m.class_id = c.id
            WHERE m.tenant_id = ? AND (m.class_id = ? OR m.class_id IS NULL)
            ORDER BY m.created_at DESC
        `).all(req.tenant.id, student?.class_id);
    } else {
        materials = db.prepare(`
            SELECT m.id, m.title, m.description, m.file_url, m.class_id, m.created_at, u.name as teacher_name, c.name as class_name
            FROM materials m
            JOIN users u ON m.created_by = u.id
            LEFT JOIN classes c ON m.class_id = c.id
            WHERE m.tenant_id = ?
            ORDER BY m.created_at DESC
        `).all(req.tenant.id);
    }
    res.json(materials);
});

// Upload Study Material (Admin & Teacher)
router.post('/', requireRole(['admin', 'teacher']), uploadMaterial.single('material_file'), (req, res) => {
    const { title, description, class_id } = req.body;
    const file_url = getFileUrl(req, req.file);

    try {
        const stmt = db.prepare('INSERT INTO materials (tenant_id, title, description, class_id, file_url, created_by) VALUES (?, ?, ?, ?, ?, ?)');
        const info = stmt.run(req.tenant.id, title, description, class_id || null, file_url, req.user.userId);
        res.status(201).json({ id: info.lastInsertRowid, title, file_url });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Study Material (Admin & Teacher)
router.delete('/:id', requireRole(['admin', 'teacher']), (req, res) => {
    try {
        const material = db.prepare('SELECT * FROM materials WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
        if (!material) return res.status(404).json({ error: 'Material not found' });

        db.prepare('DELETE FROM materials WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenant.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload error handler
router.use(handleUploadError);

module.exports = router;
