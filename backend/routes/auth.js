const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const { createLog } = require('../utils/logger');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', tenantId = null } = req.body;
    
    if (!['user', 'owner'].includes(role)) {
      return res.status(400).json({ 
        msg: `Invalid account type selected. Must be 'user' or 'owner'.` 
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      passwordHash: password,
      role,
      tenantId
    });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        tenantId: user.tenantId
      }
    };

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not defined.');
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } });
      }
    );
  } catch (err) {
    console.error('[AUTH_REG_CRITICAL_FAIL]', err);
    res.status(500).json({ 
      msg: 'Server error during registration.', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required for authentication.' });
  }

  try {
    console.log(`[AUTH] Login attempt for: ${email}`);
    let user = await User.findOne({ email });

    if (!user) {
      console.warn(`[AUTH] Login failed: User not found for ${email}`);
      return res.status(401).json({ msg: 'Authentication failed. Please check your email and password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      console.warn(`[AUTH] Login failed: Password mismatch for ${email}`);
      return res.status(401).json({ msg: 'Authentication failed. Please check your email and password.' });
    }

    // SaaS Activity Log
    if (user.tenantId) {
      await createLog(user.id, user.tenantId, 'USER_LOGIN', { ip: req.ip });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        tenantId: user.tenantId
      }
    };

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not defined.');
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } });
      }
    );
  } catch (err) {
    console.error('[AUTH_LOGIN_CRITICAL_FAIL]', err);
    res.status(500).json({ 
      msg: 'Server error during login authentication node.', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change authenticated user's password
 * @access  Private
 */
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User profile not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Actual current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Log the security action
    if (user.tenantId) {
      await createLog(user.id, user.tenantId, 'PASSWORD_CHANGE', { type: 'manual' });
    }

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token (Mock Email System)
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'User with this email does not exist' });
    }

    // Generate random hex token
    const token = require('crypto').randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry

    await user.save();

    // MOCK EMAIL: In a real app, we'd send an email here.
    // For this dev environment, we return the token so you can use it in the UI.
    console.log(`[DEV MOCK EMAIL] Password Reset Token for ${email}: ${token}`);
    
    res.json({ 
      msg: 'Password reset link generated.',
      debug_token: token // Only for dev testing
    });
  } catch (err) {
    console.error('[AUTH_FORGOT_PW_ERROR]', err);
    res.status(500).json({ msg: 'Server error during password reset request.', error: err.message });
  }
});

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.put('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Password reset token is invalid or has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    
    // Clear reset fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();
    res.json({ msg: 'Password has been reset successfully' });
  } catch (err) {
    console.error('[AUTH_RESET_PW_ERROR]', err);
    res.status(500).json({ msg: 'Server error during password reset.', error: err.message });
  }
});

module.exports = router;
