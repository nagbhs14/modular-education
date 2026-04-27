const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();

router.use(authMiddleware);

// Get assignments
router.get('/assignments', (req, res) => {
    const assignments = db.prepare('SELECT * FROM assignments WHERE tenant_id = ?').all(req.tenant.id);
    res.json(assignments);
});

// Create assignment (Teacher/Admin)
router.post('/assignments', requireRole(['admin', 'teacher']), (req, res) => {
    const { title, description } = req.body;
    try {
        const stmt = db.prepare("INSERT INTO assignments (tenant_id, title, description, created_by) VALUES (?, ?, ?, ?)");
        const info = stmt.run(req.tenant.id, title, description, req.user.userId);
        res.status(201).json({ id: info.lastInsertRowid, title });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit assignment (Student)
router.post('/submissions', requireRole(['student']), (req, res) => {
    const { assignment_id, content } = req.body;
    try {
        const student = db.prepare('SELECT id FROM students WHERE user_id = ? AND tenant_id = ?').get(req.user.userId, req.tenant.id);
        const stmt = db.prepare("INSERT INTO submissions (tenant_id, assignment_id, student_id, content) VALUES (?, ?, ?, ?)");
        stmt.run(req.tenant.id, assignment_id, student.id, content);
        res.status(201).json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// View submissions (Teacher)
router.get('/assignments/:id/submissions', requireRole(['admin', 'teacher']), (req, res) => {
    const submissions = db.prepare(`
        SELECT sub.id, s.name as student_name, sub.content, sub.submitted_at 
        FROM submissions sub
        JOIN students s ON sub.student_id = s.id
        WHERE sub.tenant_id = ? AND sub.assignment_id = ?
    `).all(req.tenant.id, req.params.id);
    res.json(submissions);
});

module.exports = router;
