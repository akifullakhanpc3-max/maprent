const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const bearer = token.split(' ')[1] || token; // handle 'Bearer TOKEN' or just 'TOKEN'
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
    
    // Safety check: Ensure the payload structure matches expectations
    if (!decoded || !decoded.user) {
      console.warn('[AUTH_RESILIENCE] Malformed token payload detected');
      return res.status(401).json({ msg: 'Token parsing failed or malformed signal' });
    }

    // Attach decoded user data to request
    req.user = {
      id: decoded.user.id,
      role: decoded.user.role,
      tenantId: decoded.user.tenantId ? decoded.user.tenantId.toString() : null
    };

    // Optional Check: Securely verify user exists and is not blocked
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'User profile no longer exists' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ msg: 'Your account has been blocked by an administrator.' });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;
