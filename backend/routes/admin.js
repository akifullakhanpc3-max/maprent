const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const adminAuth = require('../middleware/adminAuth');

// All routes in this file are protected by adminAuth middleware

const Tenant = require('../models/Tenant');
const Log = require('../models/Log');
const { createLog } = require('../utils/logger');

// Middleware to ensure Master Admin only
const masterAdminOnly = (req, res, next) => {
  if (req.user.role !== 'master_admin') {
    return res.status(403).json({ msg: 'Access denied: Master Admin role required' });
  }
  next();
};

// @route   GET /api/admin/logs
// @desc    Get activity logs (Admin sees own tenant, Master Admin sees all)
// @access  Private (Admin+)
router.get('/logs', adminAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'master_admin') {
      if (!req.user.tenantId) return res.status(403).json({ msg: 'No tenant association found' });
      query.tenantId = req.user.tenantId;
    }

    const logs = await Log.find(query)
      .populate('userId', 'name email role')
      .populate('tenantId', 'name domain')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/tenants
// @desc    Get all tenants (Master Admin only)
// @access  Private (Master Admin)
router.get('/tenants', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ name: 1 });
    res.json(tenants);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/admin/create-tenant
// @desc    Create a new tenant co-domain (Master Admin only)
// @access  Private (Master Admin)
router.post('/create-tenant', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const { name, domain, adminEmail } = req.body;
    
    // Check if admin exists
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) return res.status(404).json({ msg: 'Specified admin user does not exist' });

    const tenant = new Tenant({
      name,
      domain,
      adminId: adminUser._id
    });

    await tenant.save();

    // Link admin to tenant
    adminUser.tenantId = tenant._id;
    adminUser.role = 'admin';
    await adminUser.save();

    await createLog(req.user.id, tenant._id, 'TENANT_CREATED', { tenantName: name, domain });

    res.json(tenant);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get platform / tenant stats
// @access  Private (Admin+)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const isMaster = req.user.role === 'master_admin';
    const query = isMaster ? {} : { tenantId: req.user.tenantId };

    const totalUsers = await User.countDocuments(query);
    const totalProperties = await Property.countDocuments(query);
    const totalBookings = await Booking.countDocuments(query);
    
    // Recent activity for dashboard
    const recentLogs = await Log.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingProperties = await Property.countDocuments({ ...query, status: 'pending' });
    const featuredProperties = await Property.countDocuments({ ...query, isFeatured: true });

    res.json({
      stats: {
        totalUsers,
        totalProperties,
        totalBookings,
        pendingProperties,
        featuredProperties
      },
      recentLogs
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (excluding admins, without passwords)
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/users/:id/block
// @desc    Toggle user block status
// @access  Private (Admin)
router.put('/users/:id/block', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ msg: 'Valid user not found' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();
    
    res.json({ msg: user.isBlocked ? 'User blocked' : 'User unblocked', isBlocked: user.isBlocked });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user AND cascade delete their properties
// @access  Private (Admin)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ msg: 'Valid user not found' });
    }

    // Cascade delete properties
    await Property.deleteMany({ ownerId: req.params.id });
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ msg: 'User and associated properties purged' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/properties
// @desc    Get all properties (queue management)
// @access  Private (Admin)
router.get('/properties', adminAuth, async (req, res) => {
  try {
    // Populate the owner data
    const properties = await Property.find()
      .populate('ownerId', 'name email isBlocked')
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/properties/:id/approve
// @desc    Set property status to approved
// @access  Private (Admin)
router.put('/properties/:id/approve', adminAuth, async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
      .populate('ownerId', 'name email isBlocked');
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/properties/:id/reject
// @desc    Set property status to rejected
// @access  Private (Admin)
router.put('/properties/:id/reject', adminAuth, async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true })
      .populate('ownerId', 'name email isBlocked');
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/properties/:id/pending
// @desc    Set property status to pending
// @access  Private (Admin)
router.put('/properties/:id/pending', adminAuth, async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { status: 'pending' }, { new: true })
      .populate('ownerId', 'name email isBlocked');
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/properties/:id/feature
// @desc    Toggle isFeatured status
// @access  Private (Admin)
router.put('/properties/:id/feature', adminAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    
    property.isFeatured = !property.isFeatured;
    await property.save();

    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/properties/:id
// @desc    Delete property
// @access  Private (Admin)
router.delete('/properties/:id', adminAuth, async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    res.json({ msg: 'Property strictly deleted by Admin' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/properties/:id
// @desc    Full property edit by Admin
// @access  Private (Admin)
router.put('/properties/:id', adminAuth, async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    const { title, description, price, bhkType, phone, whatsapp, amenities } = req.body;
    
    if (title) property.title = title;
    if (description) property.description = description;
    if (price) property.price = price;
    if (bhkType) property.bhkType = bhkType;
    if (phone) property.phone = phone;
    if (whatsapp !== undefined) property.whatsapp = whatsapp;
    if (amenities) {
      property.amenities = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
    }

    await property.save();
    
    // Repopulate owner so the table doesn't lose the user ref
    const updatedProp = await Property.findById(property._id).populate('ownerId', 'name email isBlocked');
    
    res.json(updatedProp);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Private (Admin)
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('propertyId', 'title')
      .populate('userId', 'name email')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/bookings/:id
// @desc    Delete booking
// @access  Private (Admin)
router.delete('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    res.json({ msg: 'Booking strictly deleted by Admin' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/bookings/:id/status
// @desc    Update booking status by administrator
// @access  Private (Admin)
router.put('/bookings/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status update for administrator' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    booking.status = status;
    await booking.save();

    // Log the administrative action
    if (req.user.tenantId || booking.tenantId) {
      await createLog(req.user.id, (req.user.tenantId || booking.tenantId), 'ADMIN_BOOKING_STATUS', { 
        bookingId: booking._id, 
        newStatus: status 
      });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
