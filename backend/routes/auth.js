import express from 'express';
import { firebaseAuth, login, getMe } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/firebase-auth
// @desc    Authenticate user via Firebase (Google)
// @access  Public
router.post('/firebase-auth', firebaseAuth);

// @route   POST /api/auth/login
// @desc    Standard Login
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', auth, getMe);

export default router;
