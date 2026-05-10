import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.user) {
      return res.status(401).json({ msg: 'Invalid token structure' });
    }

    // Check if user still exists in DB
    const user = await User.findById(decoded.user.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ msg: 'User account no longer exists' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ msg: 'Your account has been blocked.' });
    }

    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('[AUTH_MIDDLEWARE_FAIL]', err.message);
    res.status(401).json({ msg: 'Token is not valid or has expired' });
  }
};

export default auth;
