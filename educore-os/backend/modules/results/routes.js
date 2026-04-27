const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();

router.use(authMiddleware);

// Get Results
router.get('/', (req, res) => {
    // If student, get only their results
    if (req.user.role === 'student') {
        const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.userId);
        const results = db.prepare(`
            SELECT r.exam_name, r.score, r.grades, r.published 
            FROM results r
            WHERE r.tenant_id = ? AND r.student_id = ? AND r.published = 1
        `).all(req.tenant.id, student.id);
        return res.json(results);
    }
    
    // Admin/Teacher get all results
    const results = db.prepare(`
        SELECT r.id, s.name, s.system_uid, r.exam_name, r.score, r.grades, r.published 
        FROM results r
        JOIN students s ON r.student_id = s.id
        WHERE r.tenant_id = ?
    `).all(req.tenant.id);
    res.json(results);
});

// Publish Result (Admin & Teacher)
router.post('/', requireRole(['admin', 'teacher']), (req, res) => {
    // Expected to pass the 'system_uid' (e.g. ABC-101) instead of internal DB id, 
    // simulating the lookup by USN/ID feature.
    const { system_uid, exam_name, score, grades, published } = req.body;
    
    try {
        const student = db.prepare('SELECT id FROM students WHERE system_uid = ? AND tenant_id = ?').get(system_uid, req.tenant.id);
        if (!student) return res.status(404).json({ error: 'Student not found with that UID' });

        const stmt = db.prepare('INSERT INTO results (tenant_id, student_id, exam_name, score, grades, published) VALUES (?, ?, ?, ?, ?, ?)');
        const info = stmt.run(req.tenant.id, student.id, exam_name, score, grades, published !== undefined ? published : 1);
        res.status(201).json({ id: info.lastInsertRowid, message: 'Result published' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
