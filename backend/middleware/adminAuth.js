const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    
    // Check Admin / Master Admin Role
    if (user.role !== 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId ? user.tenantId.toString() : null
    };
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = adminAuth;
