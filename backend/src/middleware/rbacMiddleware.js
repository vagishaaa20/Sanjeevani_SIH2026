const { ALL_ROLES } = require('../constants/roles');
const { User } = require('../models');

function requireRole(roles) {
    const allowedRoles = (Array.isArray(roles) ? roles : [roles]).map(r => r.toLowerCase());
    if (allowedRoles.some((role) => !ALL_ROLES.includes(role))) {
        throw new Error('Unknown role in authorization rule');
    }

    return async (req, res, next) => {
        if (!req.user) return res.status(403).json({ error: 'Insufficient permissions' });
        
        let role = req.user.role;
        if (!role) {
            try {
                const user = await User.findByPk(req.user.id);
                if (user) {
                    role = user.role;
                    req.user.role = role;
                }
            } catch (err) {
                console.error('Failed to fetch user role in rbac middleware:', err);
            }
        }

        if (!role || !allowedRoles.includes(role.toLowerCase())) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        return next();
    };
}

module.exports = requireRole;
