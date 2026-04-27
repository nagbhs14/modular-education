const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

// Get all students
router.get('/students', requireRole(['admin', 'teacher']), (req, res) => {
    const students = db.prepare(`
        SELECT s.id, u.id as user_id, u.name, u.username, u.password, s.system_uid, s.class_id, c.name as class_name 
        FROM students s 
        JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.tenant_id = ?
        ORDER BY u.name
    `).all(req.tenant.id);
    res.json(students);
});

// Get students by class
router.get('/students/class/:classId', requireRole(['admin', 'teacher']), (req, res) => {
    const students = db.prepare(`
        SELECT s.id, u.id as user_id, u.name, u.username, s.system_uid, s.class_id, c.name as class_name 
        FROM students s 
        JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.tenant_id = ? AND s.class_id = ?
        ORDER BY u.name
    `).all(req.tenant.id, req.params.classId);
    res.json(students);
});

// Add a student
router.post('/students', requireRole(['admin']), (req, res) => {
    const { name, username, password, class_id } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: 'Name, username and password required' });

    // Check if username exists first for clearer error
    const existing = db.prepare('SELECT id FROM users WHERE tenant_id = ? AND username = ?').get(req.tenant.id, username);
    if (existing) return res.status(400).json({ error: `Username "${username}" is already taken. Choose a different one.` });
    
    const insertTx = db.transaction(() => {
        const stmtUser = db.prepare("INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, ?)");
        const userRes = stmtUser.run(req.tenant.id, name, username, password, 'student');
        
        const count = db.prepare('SELECT COUNT(*) as c FROM students WHERE tenant_id = ?').get(req.tenant.id).c;
        const systemUid = `${req.tenant.id_prefix}-${101 + count}`;

        const stmtStudent = db.prepare("INSERT INTO students (tenant_id, user_id, class_id, system_uid) VALUES (?, ?, ?, ?)");
        const studentRes = stmtStudent.run(req.tenant.id, userRes.lastInsertRowid, class_id || null, systemUid);
        
        return { id: studentRes.lastInsertRowid, uid: systemUid, name, username };
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

// Update student password
router.put('/students/:id/password', requireRole(['admin']), (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const student = db.prepare('SELECT user_id FROM students WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenant.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    db.prepare('UPDATE users SET password = ? WHERE id = ? AND tenant_id = ?').run(password, student.user_id, req.tenant.id);
    res.json({ success: true });
});

// Get all classes
router.get('/classes', (req, res) => {
    const classes = db.prepare(`
        SELECT c.id, c.name, COUNT(s.id) as student_count 
        FROM classes c 
        LEFT JOIN students s ON s.class_id = c.id AND s.tenant_id = c.tenant_id
        WHERE c.tenant_id = ?
        GROUP BY c.id
        ORDER BY c.name
    `).all(req.tenant.id);
    res.json(classes);
});

// Create a class
router.post('/classes', requireRole(['admin']), (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    try {
        const stmt = db.prepare("INSERT INTO classes (tenant_id, name) VALUES (?, ?)");
        const info = stmt.run(req.tenant.id, name);
        res.status(201).json({ id: info.lastInsertRowid, name });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
