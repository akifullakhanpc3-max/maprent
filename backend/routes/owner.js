import express from 'express';
import auth from '../middleware/auth.js';
import { requireOwner } from '../middleware/roles.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// @route   GET /api/owner/stats
router.get('/stats', [auth, requireOwner], async (req, res) => {
  try {
    const ownerId = req.user.id;
    const totalListings = await Property.countDocuments({ ownerId });
    const activeBookingsCount = await Booking.countDocuments({ ownerId, status: 'accepted' });
    const activeBookings = await Booking.find({ ownerId, status: 'accepted' }).populate('propertyId', 'price');
    const monthlyRevenue = activeBookings.reduce((sum, booking) => sum + (booking.propertyId ? booking.propertyId.price : 0), 0);
    const occupancyRate = totalListings > 0 ? Math.round((activeBookingsCount / totalListings) * 100) : 0;
    const recentBookings = await Booking.find({ ownerId }).populate('propertyId', 'title').populate('userId', 'name email').sort({ createdAt: -1 }).limit(5);

    res.json({ stats: { totalListings, activeBookings: activeBookingsCount, monthlyRevenue, occupancyRate }, recentBookings });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

export default router;
