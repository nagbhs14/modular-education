const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');
const { uploadGeneral, getFileUrl, handleUploadError } = require('../../utils/upload');

const router = express.Router();

router.use(authMiddleware);

// Get Institution Settings
router.get('/', (req, res) => {
    // Return sanitized tenant profile
    const { name, subdomain, logo_url, about_us, fees_structure, id_prefix } = req.tenant;
    res.json({ name, subdomain, logo_url, about_us, fees_structure, id_prefix });
});

// Update Institution Settings (Admin only)
router.put('/', requireRole(['admin']), uploadGeneral.single('logo'), (req, res) => {
    const { about_us, fees_structure, name, id_prefix } = req.body;
    let logo_url = req.tenant.logo_url;
    
    // If a new file is uploaded, set the path
    if (req.file) {
        logo_url = getFileUrl(req, req.file);
    }

    try {
        const stmt = db.prepare(`
            UPDATE tenants 
            SET name = ?, about_us = ?, fees_structure = ?, logo_url = ?, id_prefix = ?
            WHERE id = ?
        `);
        // Fallback to existing logic if body field is missing
        stmt.run(
            name || req.tenant.name, 
            about_us !== undefined ? about_us : req.tenant.about_us, 
            fees_structure !== undefined ? fees_structure : req.tenant.fees_structure, 
            logo_url, 
            id_prefix || req.tenant.id_prefix,
            req.tenant.id
        );
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload error handler
router.use(handleUploadError);

module.exports = router;
