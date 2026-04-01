const express = require('express');
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { param } = require('express-validator');

const router = express.Router();

// Admin dashboard stats
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [usersCount, propertiesCount, pendingCount, bookingsCount] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments({ status: 'approved' }),
      Property.countDocuments({ status: 'pending' }),
      Booking.countDocuments()
    ]);

    res.json({
      totalUsers: usersCount,
      totalProperties: propertiesCount,
      pendingApprovals: pendingCount,
      totalBookings: bookingsCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Manage properties
router.get('/properties', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const properties = await Property.find(filter)
      .populate('ownerId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/properties/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updates = { status: req.body.status };
    if (req.body.isFeatured !== undefined) updates.isFeatured = req.body.isFeatured;

    const property = await Property.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true }
    ).populate('ownerId', 'name');

    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/properties/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Manage users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: req.body.isBlocked },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

