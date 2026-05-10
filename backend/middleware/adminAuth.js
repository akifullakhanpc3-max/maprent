import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ROLE_DEFAULTS } from '../utils/permissions.js';

const ADMIN_ROLES = ['admin', 'master_admin', 'employee', 'worker'];

const adminAuth = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured on server.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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

export default adminAuth;
