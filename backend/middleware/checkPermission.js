const { ROLE_DEFAULTS } = require('../utils/permissions');

/**
 * checkPermission(...requiredPermissions)
 * 
 * Middleware factory that gates a route behind one or more permissions.
 * - master_admin bypasses all checks (god mode).
 * - Other roles must have ALL specified permissions (explicit or from role defaults).
 * 
 * Usage:
 *   router.delete('/properties/:id', adminAuth, checkPermission('DELETE_PROPERTY'), handler);
 */
const checkPermission = (...required) => (req, res, next) => {
  try {
    // master_admin bypasses all permission checks
    if (req.user.role === 'master_admin') return next();

    // Effective permissions = explicit user.permissions OR role defaults (for existing accounts)
    const effectivePerms = (req.user.permissions && req.user.permissions.length > 0)
      ? req.user.permissions
      : (ROLE_DEFAULTS[req.user.role] || []);

    const missing = required.filter(p => !effectivePerms.includes(p));

    if (missing.length > 0) {
      return res.status(403).json({
        msg: `Access denied. Missing permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ msg: 'Permission check failed' });
  }
};

module.exports = checkPermission;
