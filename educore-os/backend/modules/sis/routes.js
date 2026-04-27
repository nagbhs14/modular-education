const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();

router.use(authMiddleware);

// Get all students
router.get('/students', requireRole(['admin', 'teacher']), (req, res) => {
    const students = db.prepare(`
        SELECT s.id, u.name, u.username, s.system_uid, c.name as class_name 
        FROM students s 
        JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.tenant_id = ?
    `).all(req.tenant.id);
    res.json(students);
});

// Add a student and auto-generate ID prefix
router.post('/students', requireRole(['admin']), (req, res) => {
    const { name, username, password, class_id } = req.body;
    
    // Use transaction for safe multi-table insert
    const insertTx = db.transaction(() => {
        // Create user
        const stmtUser = db.prepare("INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)");
        const userRes = stmtUser.run(req.tenant.id, name, username, password, 'student');
        
        // Generate Unique ID based on Tenant Prefix
        // Format: {PREFIX}-{SequentialID starting at 100 or higher}
        const lastStudent = db.prepare('SELECT id FROM students WHERE tenant_id = ? ORDER BY id DESC LIMIT 1').get(req.tenant.id);
        const sequence = lastStudent ? lastStudent.id + 100 : 101; 
        const systemUid = `${req.tenant.id_prefix}-${sequence}`;

        // Create student profile
        const stmtStudent = db.prepare("INSERT INTO students (tenant_id, user_id, class_id, system_uid) VALUES (?, ?, ?, ?)");
        const studentRes = stmtStudent.run(req.tenant.id, userRes.lastInsertRowid, class_id || null, systemUid);
        
        return { id: studentRes.lastInsertRowid, uid: systemUid, name };
    });

    try {
        const result = insertTx();
        res.status(201).json(result);
    } catch(err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already taken.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Add a teacher (Admin)
router.post('/teachers', requireRole(['admin']), (req, res) => {
    const { name, username, password } = req.body;
    try {
        const stmt = db.prepare("INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)");
        const info = stmt.run(req.tenant.id, name, username, password, 'teacher');
        res.status(201).json({ id: info.lastInsertRowid, name, role: 'teacher' });
    } catch(err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already taken.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get all teachers
router.get('/teachers', requireRole(['admin']), (req, res) => {
    const teachers = db.prepare("SELECT id, name, username FROM users WHERE tenant_id = ? AND role = 'teacher'").all(req.tenant.id);
    res.json(teachers);
});

// Get all classes
router.get('/classes', (req, res) => {
    const classes = db.prepare("SELECT id, name FROM classes WHERE tenant_id = ?").all(req.tenant.id);
    res.json(classes);
});

// Create a class
router.post('/classes', requireRole(['admin']), (req, res) => {
    const { name } = req.body;
    try {
        const stmt = db.prepare("INSERT INTO classes (tenant_id, name) VALUES (?, ?)");
        const info = stmt.run(req.tenant.id, name);
        res.status(201).json({ id: info.lastInsertRowid, name });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
