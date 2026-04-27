const express = require('express');
const db = require('../../database');
const { authMiddleware, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

const ALL_MODULES = [
  { name: 'settings', label: 'Institution Settings', description: 'Configure school branding and info', core: true },
  { name: 'sis', label: 'Student Info System', description: 'Manage students, teachers, and classes', core: true },
  { name: 'attendance', label: 'Attendance', description: 'Track student attendance daily' },
  { name: 'assignments', label: 'Assignments & LMS', description: 'Create and grade assignments' },
  { name: 'materials', label: 'Study Materials', description: 'Upload and share resources' },
  { name: 'results', label: 'Results', description: 'Publish exam results and grades' },
  { name: 'communication', label: 'Announcements', description: 'Broadcast notices' },
  { name: 'fees', label: 'Fees Management', description: 'Manage fee structures and payments' },
  { name: 'chat', label: 'Messaging', description: 'Real-time chat and notifications' },
  { name: 'analytics', label: 'Analytics', description: 'Performance dashboards and insights' },
  { name: 'ai', label: 'AI Assistant', description: 'AI-powered learning tools' },
];

// ─── GET available modules and their status ───
router.get('/', (req, res) => {
  const activeModules = req.tenant.active_modules ? req.tenant.active_modules.split(',') : [];

  const modules = ALL_MODULES.map(m => ({
    ...m,
    enabled: activeModules.includes(m.name)
  }));

  res.json({
    modules,
    plan: req.tenant.plan,
    activeCount: activeModules.length
  });
});

// ─── TOGGLE module (Admin) ───
router.put('/:moduleName', requireRole(['admin']), (req, res) => {
  const { moduleName } = req.params;
  const { enabled } = req.body;
  
  const mod = ALL_MODULES.find(m => m.name === moduleName);
  if (!mod) return res.status(404).json({ error: 'Module not found' });
  if (mod.core) return res.status(400).json({ error: 'Cannot disable core modules' });

  let activeModules = req.tenant.active_modules ? req.tenant.active_modules.split(',') : [];
  const plan = req.tenant.plan;
  
  if (enabled && !activeModules.includes(moduleName)) {
    // Check if plan allows this module
    const hasAccessToAll = plan.features.includes('all_modules') || plan.features.includes('unlimited');
    if (!hasAccessToAll && !plan.features.includes(moduleName)) {
      return res.status(403).json({ error: `Your current plan (${plan.display_name}) does not include the ${mod.label} module. Please upgrade.` });
    }

    // Check module limit
    if (plan.max_modules !== -1 && activeModules.length >= plan.max_modules) {
      return res.status(403).json({ error: `You have reached the maximum number of modules (${plan.max_modules}) for your plan. Please upgrade.` });
    }
    
    activeModules.push(moduleName);
  } else if (!enabled) {
    activeModules = activeModules.filter(m => m !== moduleName);
  }

  try {
    db.prepare('UPDATE tenants SET active_modules = ? WHERE id = ?').run(activeModules.join(','), req.tenant.id);

    // Also upsert tenant_modules table for tracking
    db.prepare('INSERT INTO tenant_modules (tenant_id, module_name, enabled) VALUES (?, ?, ?) ON CONFLICT(tenant_id, module_name) DO UPDATE SET enabled = excluded.enabled')
      .run(req.tenant.id, moduleName, enabled ? 1 : 0);

    res.json({ success: true, active_modules: activeModules, activeCount: activeModules.length });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
