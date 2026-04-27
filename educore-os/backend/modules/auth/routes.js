const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../database');

const router = express.Router();
const SECRET_KEY = 'educore_super_secret_for_demo';

// Login Endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // In a real app we'd hash passwords
    const user = db.prepare('SELECT * FROM users WHERE tenant_id = ? AND username = ? AND password = ?')
                   .get(req.tenant.id, username, password);
                   
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT
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

// Middleware for verifying JWT and Roles
const authMiddleware = (req, res, next) => {
    const token = req.get('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        // Enforce strict tenant isolation logic in token
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
