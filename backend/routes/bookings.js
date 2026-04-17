const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireUser, requireOwner } = require('../middleware/roles');
const Booking = require('../models/Booking');
const Property = require('../models/Property');

// @route   GET /api/bookings
// @desc    Fail-safe root route for discovery probes
// @access  Private (Admin or Owner)
router.get('/', auth, async (req, res) => {
  try {
    // If Admin, they see all. If Owner, they see their incoming.
    if (req.user.role === 'admin') {
      const bookings = await Booking.find().populate('propertyId', 'title');
      return res.json(bookings);
    } 
    
    if (req.user.role === 'owner') {
      const bookings = await Booking.find({ ownerId: req.user.id }).populate('propertyId', 'title');
      return res.json(bookings);
    }

    // Default for Tenants: return empty or their own if they hit this directly
    const bookings = await Booking.find({ userId: req.user.id }).populate('propertyId', 'title');
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/bookings
// @desc    Submit a new booking request
// @access  Private (Tenants)
// @access  Private (Tenant)
router.post('/', [auth, requireUser], async (req, res) => {
  try {
    const { propertyId, name, phone, moveInDate, duration, message } = req.body;

    // Verify property exists to get ownerId
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ msg: 'Property not found' });
    }

    // Optional: Prevent owner from booking their own property
    if (property.ownerId && property.ownerId.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Cannot book your own property' });
    }

    // Optional: Check if already booked/pending by this user
    const existing = await Booking.findOne({ userId: req.user.id, propertyId, status: { $in: ['pending', 'accepted'] } });
    if (existing) {
      return res.status(400).json({ msg: 'You already have an active request for this property' });
    }

    const newBooking = new Booking({
      userId: req.user.id,
      tenantId: req.user.tenantId || null,
      propertyId,
      ownerId: property.ownerId,
      name,
      phone,
      moveInDate,
      duration,
      message
    });

    const booking = await newBooking.save();
    res.status(201).json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/bookings/my-requests
// @desc    Get all outgoing booking requests made by the user
// @access  Private
// @access  Private (Tenant)
router.get('/my-requests', [auth, requireUser], async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('propertyId', 'title location price images')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/bookings/incoming
// @desc    Get all incoming booking requests built for the owner
// @access  Private (Owners)
// @access  Private (Owner)
router.get('/incoming', [auth, requireOwner], async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user.id })
      .populate('propertyId', 'title location price images')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (accept, reject, cancel)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted', 'rejected', 'cancelled'
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    // If owner, they can accept or reject
    if (booking.ownerId.toString() === req.user.id) {
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status update for owner' });
      }
    }
    // If tenant, they can cancel
    else if (booking.userId.toString() === req.user.id) {
      if (status !== 'cancelled') {
        return res.status(400).json({ msg: 'Tenants can only cancel bookings' });
      }
    } else {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
