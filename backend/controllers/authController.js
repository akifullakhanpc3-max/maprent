import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import admin from '../config/firebaseAdmin.js';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '../services/mailService.js';

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
      console.error('🚨 [CRITICAL] Firebase Admin SDK is not initialized.');
      return res.status(500).json({ 
        msg: '🚨 [BACKEND_ERROR] Firebase Admin SDK is NOT initialized on the server. Please check your .env file.' 
      });
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
 * Standard Registration
 */
export const register = async (req, res) => {
  const { name, email, phone, password, role = 'user' } = req.body;

  try {
    // 1. Check if user already exists (by email or phone)
    let query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });

    if (query.length === 0) {
      return res.status(400).json({ msg: 'Please provide email or phone number.' });
    }

    let existingUser = await User.findOne({ $or: query });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with this email or phone.' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create User
    const user = new User({
      name,
      email: email || undefined,
      phone,
      passwordHash,
      role
    });

    await user.save();

    // 4. Generate JWT
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    });
  } catch (err) {
    console.error('[AUTH_REGISTER_ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * Standard Login (Support Email or Phone)
 */
export const login = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    });
  } catch (err) {
    console.error('[AUTH_LOGIN_ERROR]', err.message);
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

/**
 * Get User Wishlist (Saved Properties)
 */
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedProperties');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user.savedProperties);
  } catch (err) {
    console.error('[WISHLIST_GET_ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * Toggle Property in Wishlist
 */
export const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const propertyId = req.params.propertyId;
    const isSaved = user.savedProperties.includes(propertyId);

    if (isSaved) {
      // Remove from wishlist
      user.savedProperties = user.savedProperties.filter(id => id.toString() !== propertyId);
    } else {
      // Add to wishlist
      user.savedProperties.push(propertyId);
    }

    await user.save();
    res.json(user.savedProperties);
  } catch (err) {
    console.error('[WISHLIST_TOGGLE_ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
/**
 * Forgot Password - Send Reset Email
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ msg: 'Recovery link sent if email exists.' });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send Email (Non-blocking to improve response time)
    sendResetPasswordEmail(user.email, resetToken).catch(err => {
      console.error('[MAIL_BACKGROUND_ERROR]', err);
    });

    res.json({ 
      msg: 'Recovery link sent to your email.',
      debug_token: process.env.NODE_ENV === 'development' ? resetToken : null 
    });
  } catch (err) {
    console.error('[AUTH_FORGOT_ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * Reset Password - Using Token
 */
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired reset token.' });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    
    // Clear reset fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({ msg: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('[AUTH_RESET_ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * Admin Reset User Password
 * Allows admin to manually set a password for a user
 */
export const adminResetUserPassword = async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Hash New Password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    res.json({ msg: `Password for ${user.name} has been updated.` });
  } catch (err) {
    console.error('[ADMIN_RESET_USER_PASS_ERROR]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
