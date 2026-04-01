const express = require('express');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const { authMiddleware } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

const router = express.Router();

// Create booking (tenant)
router.post('/', authMiddleware, [
  body('propertyId').notEmpty(),
  body('name').notEmpty(),
  body('phone').notEmpty(),
  body('moveInDate').isISO8601(),
  body('duration').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const property = await Property.findById(req.body.propertyId);
    if (!property || property.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid property' });
    }

    const booking = new Booking({
      ...req.body,
      userId: req.user._id,
      ownerId: property.ownerId
    });

    await booking.save();
    const populated = await Booking.findById(booking._id)
      .populate('propertyId', 'title rent location')
      .populate('userId', 'name')
      .populate('ownerId', 'name');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user bookings (tenant/owner)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = { $or: [{ userId: req.user._id }, { ownerId: req.user._id }] };
    const bookings = await Booking.find(query)
      .populate('propertyId', 'title rent images location')
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking status (owner only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      ownerId: req.user._id 
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel booking (user only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'cancelled' },
      { new: true }
    ).populate('propertyId', 'title');
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

