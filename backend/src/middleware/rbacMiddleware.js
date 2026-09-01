const { ALL_ROLES } = require('../constants/roles');

function requireRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (allowedRoles.some((role) => !ALL_ROLES.includes(role))) {
        throw new Error('Unknown role in authorization rule');
    }

    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        return next();
    };
}

module.exports = requireRole;
