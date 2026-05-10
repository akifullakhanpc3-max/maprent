/**
 * Role-based authorization middleware
 */

// Only users with role 'user' (Tenants)
export const requireUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Tenant privileges required.' });
  }
};

// Only users with role 'owner' (Landlords)
export const requireOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Property Owner privileges required.' });
  }
};

// Only users with role 'admin'
export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'master_admin')) {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
  }
};
