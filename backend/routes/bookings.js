import express from 'express';
import auth from '../middleware/auth.js';
import { requireUser, requireOwner } from '../middleware/roles.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

const router = express.Router();

// @route   GET /api/bookings
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'master_admin') {
      const bookings = await Booking.find().populate('propertyId', 'title');
      return res.json(bookings);
    } 
    
    if (req.user.role === 'owner') {
      const bookings = await Booking.find({ ownerId: req.user.id }).populate('propertyId', 'title');
      return res.json(bookings);
    }

    const bookings = await Booking.find({ userId: req.user.id }).populate('propertyId', 'title');
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/bookings
router.post('/', [auth, requireUser], async (req, res) => {
  try {
    const { propertyId, name, phone, moveInDate, duration, message } = req.body;
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    if (property.ownerId && property.ownerId.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Cannot book your own property' });
    }

    const existing = await Booking.findOne({ userId: req.user.id, propertyId, status: { $in: ['pending', 'accepted'] } });
    if (existing) return res.status(400).json({ msg: 'You already have an active request for this property' });

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

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/bookings/my-requests
router.get('/my-requests', [auth, requireUser], async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('propertyId', 'title location price images')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/bookings/incoming
router.get('/incoming', [auth, requireOwner], async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user.id })
      .populate('propertyId', 'title location price images')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/bookings/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    if (booking.ownerId.toString() === req.user.id) {
      if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ msg: 'Invalid status update' });
    } else if (booking.userId.toString() === req.user.id) {
      if (status !== 'cancelled') return res.status(400).json({ msg: 'Tenants can only cancel' });
    } else {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
