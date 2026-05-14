import express from 'express';
import { firebaseAuth, login, register, getMe, getWishlist, toggleWishlist, forgotPassword, resetPassword, adminResetUserPassword, diagMail } from '../controllers/authController.js';
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

// @route   POST /api/auth/register
// @desc    Standard Registration
// @access  Public
router.post('/register', register);

// @route   GET /api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', auth, getMe);

// @route   GET /api/auth/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/wishlist', auth, getWishlist);

// @route   PUT /api/auth/wishlist/:propertyId
// @desc    Add/Remove property from wishlist
// @access  Private
router.put('/wishlist/:propertyId', auth, toggleWishlist);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', resetPassword);

// @route   GET /api/auth/diag-mail
// @desc    Diagnostic email test
// @access  Public (Temporary)
router.get('/diag-mail', diagMail);

// @route   PUT /api/auth/admin/reset-user-password
// @desc    Admin reset user password
// @access  Private (Admin)
router.put('/admin/reset-user-password', auth, adminResetUserPassword);

export default router;
