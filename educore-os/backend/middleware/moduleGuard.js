const moduleGuard = (moduleName) => {
    return (req, res, next) => {
        const activeModules = req.tenant.active_modules.split(',');
        if (!activeModules.includes(moduleName)) {
            return res.status(403).json({ error: `Module '${moduleName}' is disabled for this institution.` });
        }
        next();
    };
};

module.exports = moduleGuard;
