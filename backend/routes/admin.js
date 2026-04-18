const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission');
const { PERMISSIONS, ALL_PERMISSIONS, ROLE_DEFAULTS } = require('../utils/permissions');

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
router.get('/logs', adminAuth, checkPermission(PERMISSIONS.VIEW_ANALYTICS), async (req, res) => {
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
    
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) return res.status(404).json({ msg: 'Specified admin user does not exist' });

    const tenant = new Tenant({ name, domain, adminId: adminUser._id });
    await tenant.save();

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
router.get('/dashboard', adminAuth, checkPermission(PERMISSIONS.VIEW_ANALYTICS), async (req, res) => {
  try {
    const isMaster = req.user.role === 'master_admin';
    const query = isMaster ? {} : { tenantId: req.user.tenantId };

    const totalUsers = await User.countDocuments(query);
    const totalProperties = await Property.countDocuments(query);
    const totalBookings = await Booking.countDocuments(query);
    
    const recentLogs = await Log.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingProperties = await Property.countDocuments({ ...query, status: 'pending' });
    const featuredProperties = await Property.countDocuments({ ...query, isFeatured: true });

    res.json({
      stats: { totalUsers, totalProperties, totalBookings, pendingProperties, featuredProperties },
      recentLogs
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/users
// @desc    Get all platform users (non-admin)
// @access  Private (MANAGE_USERS)
router.get('/users', adminAuth, checkPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['user', 'owner'] } })
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
// @access  Private (MANAGE_USERS)
router.put('/users/:id/block', adminAuth, checkPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !['user', 'owner'].includes(user.role)) {
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
// @access  Private (MANAGE_USERS)
router.delete('/users/:id', adminAuth, checkPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !['user', 'owner'].includes(user.role)) {
      return res.status(404).json({ msg: 'Valid user not found' });
    }

    await Property.deleteMany({ ownerId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ msg: 'User and associated properties purged' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/properties
// @desc    Get all properties (queue management)
// @access  Private (Admin+)
router.get('/properties', adminAuth, async (req, res) => {
  try {
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
// @access  Private (APPROVE_PROPERTY)
router.put('/properties/:id/approve', adminAuth, checkPermission(PERMISSIONS.APPROVE_PROPERTY), async (req, res) => {
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
// @access  Private (REJECT_PROPERTY)
router.put('/properties/:id/reject', adminAuth, checkPermission(PERMISSIONS.REJECT_PROPERTY), async (req, res) => {
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
// @access  Private (APPROVE_PROPERTY)
router.put('/properties/:id/pending', adminAuth, checkPermission(PERMISSIONS.APPROVE_PROPERTY), async (req, res) => {
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
// @access  Private (FEATURE_PROPERTY)
router.put('/properties/:id/feature', adminAuth, checkPermission(PERMISSIONS.FEATURE_PROPERTY), async (req, res) => {
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
// @access  Private (DELETE_PROPERTY)
router.delete('/properties/:id', adminAuth, checkPermission(PERMISSIONS.DELETE_PROPERTY), async (req, res) => {
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
// @access  Private (Admin+)
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
    if (amenities) property.amenities = Array.isArray(amenities) ? amenities : JSON.parse(amenities);

    await property.save();
    const updatedProp = await Property.findById(property._id).populate('ownerId', 'name email isBlocked');
    res.json(updatedProp);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/bookings
// @access  Private (MANAGE_BOOKINGS)
router.get('/bookings', adminAuth, checkPermission(PERMISSIONS.MANAGE_BOOKINGS), async (req, res) => {
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
// @access  Private (MANAGE_BOOKINGS)
router.delete('/bookings/:id', adminAuth, checkPermission(PERMISSIONS.MANAGE_BOOKINGS), async (req, res) => {
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
// @access  Private (MANAGE_BOOKINGS)
router.put('/bookings/:id/status', adminAuth, checkPermission(PERMISSIONS.MANAGE_BOOKINGS), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status update for administrator' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    booking.status = status;
    await booking.save();

    if (req.user.tenantId || booking.tenantId) {
      await createLog(req.user.id, (req.user.tenantId || booking.tenantId), 'ADMIN_BOOKING_STATUS', { 
        bookingId: booking._id, newStatus: status 
      });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─────────────────────────────────────────────────────────
// STAFF MANAGEMENT ROUTES (Master Admin Only)
// ─────────────────────────────────────────────────────────

// @route   GET /api/admin/staff
// @desc    Get all staff accounts (admin/employee/worker)
// @access  Private (Master Admin)
router.get('/staff', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'employee', 'worker', 'master_admin'] } })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/admin/staff
// @desc    Create a new staff account with role + permissions
// @access  Private (Master Admin)
router.post('/staff', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    if (!['admin', 'employee', 'worker'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid staff role. Must be admin, employee, or worker.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Use provided permissions, or default for the role
    const effectivePermissions = (permissions && permissions.length > 0)
      ? permissions
      : ROLE_DEFAULTS[role] || [];

    const staff = new User({
      name,
      email,
      passwordHash,
      role,
      permissions: effectivePermissions,
    });

    await staff.save();
    const { passwordHash: _, ...safeStaff } = staff.toObject();
    res.status(201).json(safeStaff);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
});

// @route   PUT /api/admin/staff/:id/permissions
// @desc    Update the permissions of a staff member
// @access  Private (Master Admin)
router.put('/staff/:id/permissions', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ msg: 'Permissions must be an array.' });

    // Validate that all permissions are known
    const invalid = permissions.filter(p => !ALL_PERMISSIONS.includes(p));
    if (invalid.length > 0) return res.status(400).json({ msg: `Unknown permissions: ${invalid.join(', ')}` });

    const staff = await User.findById(req.params.id).select('-passwordHash');
    if (!staff || !['admin', 'employee', 'worker'].includes(staff.role)) {
      return res.status(404).json({ msg: 'Staff member not found' });
    }

    staff.permissions = permissions;
    await staff.save();
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/staff/:id/role
// @desc    Promote or demote a staff member's role
// @access  Private (Master Admin)
router.put('/staff/:id/role', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'employee', 'worker'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role. Allowed: admin, employee, worker.' });
    }

    const staff = await User.findById(req.params.id).select('-passwordHash');
    if (!staff || staff.role === 'master_admin') {
      return res.status(404).json({ msg: 'Staff member not found or protected account.' });
    }

    staff.role = role;
    // Reset permissions to new role defaults when role changes
    if (!staff.permissions || staff.permissions.length === 0) {
      staff.permissions = ROLE_DEFAULTS[role] || [];
    }
    await staff.save();
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/staff/:id
// @desc    Delete a staff account
// @access  Private (Master Admin)
router.delete('/staff/:id', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role === 'master_admin') {
      return res.status(404).json({ msg: 'Staff member not found or cannot delete master admin.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Staff account removed.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
