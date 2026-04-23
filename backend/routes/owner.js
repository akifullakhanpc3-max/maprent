const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireOwner } = require('../middleware/roles');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

// @route   GET /api/owner/stats
// @desc    Get owner's dashboard stats
// @access  Private (Owner)
router.get('/stats', [auth, requireOwner], async (req, res) => {
  try {
    const ownerId = req.user.id;

    // 1. Total Listings
    const totalListings = await Property.countDocuments({ ownerId });

    // 2. Active Bookings (Accepted)
    const activeBookingsCount = await Booking.countDocuments({ ownerId, status: 'accepted' });

    // 3. Monthly Revenue
    // Sum of rent for all accepted bookings (simplification)
    const activeBookings = await Booking.find({ ownerId, status: 'accepted' }).populate('propertyId', 'price');
    const monthlyRevenue = activeBookings.reduce((sum, booking) => {
      return sum + (booking.propertyId ? booking.propertyId.price : 0);
    }, 0);

    // 4. Occupancy Rate
    const occupancyRate = totalListings > 0 ? Math.round((activeBookingsCount / totalListings) * 100) : 0;

    // 5. Recent Activity (Latest 5 bookings)
    const recentBookings = await Booking.find({ ownerId })
      .populate('propertyId', 'title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalListings,
        activeBookings: activeBookingsCount,
        monthlyRevenue,
        occupancyRate
      },
      recentBookings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
