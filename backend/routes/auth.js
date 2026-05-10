import express from 'express';
import { firebaseAuth, login, getMe, getWishlist, toggleWishlist } from '../controllers/authController.js';
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

// @route   GET /api/auth/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/wishlist', auth, getWishlist);

// @route   PUT /api/auth/wishlist/:propertyId
// @desc    Add/Remove property from wishlist
// @access  Private
router.put('/wishlist/:propertyId', auth, toggleWishlist);

export default router;
