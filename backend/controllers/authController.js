import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import admin from '../config/firebaseAdmin.js';

/**
 * Verifies Firebase Token and handles User Login/Registration
 */
export const firebaseAuth = async (req, res) => {
  const { firebaseToken, role = 'user' } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ msg: 'Firebase token is required.' });
  }

  try {
    let decodedToken;

    // 1. Verify token with Firebase Admin
    if (admin.apps.length > 0) {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    } else {
      console.error('[AUTH_ERROR] Firebase Admin SDK not initialized.');
      return res.status(500).json({ msg: 'Server configuration error: Firebase Admin SDK not ready.' });
    }

    const { uid, email, name, picture } = decodedToken;
    console.log(`[AUTH] Firebase Login Attempt: ${email || uid}`);

    // 2. Find or Create User
    let user = await User.findOne({ 
      $or: [
        { firebaseUid: uid },
        { email: email }
      ]
    });

    if (!user) {
      // Create new user if not exists
      user = new User({
        name: name || 'User',
        email: email,
        firebaseUid: uid,
        role: role,
        avatar: picture
      });
      await user.save();
      console.log(`[AUTH] New user registered via Google: ${email}`);
    } else {
      // Sync firebaseUid if user registered via email before
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // 3. Generate internal JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
          }
        });
      }
    );
  } catch (error) {
    console.error('[AUTH_FIREBASE_CRITICAL_FAIL]', error.message);
    res.status(401).json({ 
      msg: 'Authentication failed: Invalid or expired Firebase token.', 
      error: error.message 
    });
  }
};

/**
 * Standard Email/Password Login (Legacy/Fallback)
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * Get Authenticated User Details
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
