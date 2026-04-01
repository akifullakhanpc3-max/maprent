/**
 * Role-based authorization middleware
 */

// Only users with role 'user' (Tenants)
exports.requireUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Tenant privileges required.' });
  }
};

// Only users with role 'owner' (Landlords)
exports.requireOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Property Owner privileges required.' });
  }
};

// Only users with role 'admin'
exports.requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
  }
};
