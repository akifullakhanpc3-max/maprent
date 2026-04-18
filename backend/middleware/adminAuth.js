const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLE_DEFAULTS } = require('../utils/permissions');

const ADMIN_ROLES = ['admin', 'master_admin', 'employee', 'worker'];

const adminAuth = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const bearer = token.split(' ')[1] || token;
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
    
    // Validate user securely against the database
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'User profile no longer exists' });
    }
    
    // Check that user has an admin-tier role
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
    }

    // Effective permissions: use explicit array if set, else use role defaults
    const effectivePermissions = (user.permissions && user.permissions.length > 0)
      ? user.permissions
      : (ROLE_DEFAULTS[user.role] || []);

    req.user = {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      permissions: effectivePermissions,
    };
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = adminAuth;
