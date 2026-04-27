const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../database');

const router = express.Router();
const SECRET_KEY = 'educore_super_secret_for_demo';

// Admin/Teacher Login — only allows admin/teacher roles
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE tenant_id = ? AND username = ? AND password = ?')
                   .get(req.tenant.id, username, password);
                   
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // SECURITY: Only admin/teacher can login via admin portal
    if (user.role === 'student') {
        return res.status(403).json({ error: 'Students must use the student login portal' });
    }
    
    const token = jwt.sign({ 
        userId: user.id, 
        tenantId: req.tenant.id,
        role: user.role,
        name: user.name
    }, SECRET_KEY, { expiresIn: '1d' });
    
    res.json({
        token,
        user: { id: user.id, name: user.name, role: user.role }
    });
});

// Student Login — only allows student role
router.post('/student-login', (req, res) => {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE tenant_id = ? AND username = ? AND password = ?')
                   .get(req.tenant.id, username, password);
                   
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // SECURITY: Only students can login via student portal
    if (user.role !== 'student') {
        return res.status(403).json({ error: 'This portal is for students only' });
    }

    // Also fetch student profile
    const student = db.prepare('SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.user_id = ? AND s.tenant_id = ?')
                      .get(user.id, req.tenant.id);
    
    const token = jwt.sign({ 
        userId: user.id, 
        tenantId: req.tenant.id,
        role: user.role,
        name: user.name,
        studentId: student?.id,
        systemUid: student?.system_uid
    }, SECRET_KEY, { expiresIn: '1d' });
    
    res.json({
        token,
        user: { id: user.id, name: user.name, role: user.role, systemUid: student?.system_uid, className: student?.class_name }
    });
});

// Middleware for verifying JWT and Roles
const authMiddleware = (req, res, next) => {
    const token = req.get('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.tenantId !== req.tenant.id) {
            return res.status(403).json({ error: 'Token does not belong to this tenant' });
        }
        req.user = decoded;
        next();
    } catch(err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    }
};

module.exports = {
    authRouter: router,
    authMiddleware,
    requireRole
};
