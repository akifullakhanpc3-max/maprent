import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import adminAuth from '../middleware/adminAuth.js';
import checkPermission from '../middleware/checkPermission.js';
import { PERMISSIONS, ALL_PERMISSIONS, ROLE_DEFAULTS } from '../utils/permissions.js';
import Tenant from '../models/Tenant.js';
import Log from '../models/Log.js';
import { createLog } from '../utils/logger.js';

const router = express.Router();

const masterAdminOnly = (req, res, next) => {
  if (req.user.role !== 'master_admin') {
    return res.status(403).json({ msg: 'Access denied: Master Admin role required' });
  }
  next();
};

// @route   GET /api/admin/logs
router.get('/logs', adminAuth, checkPermission(PERMISSIONS.VIEW_ANALYTICS), async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'master_admin') {
      if (!req.user.tenantId) return res.status(403).json({ msg: 'No tenant association found' });
      query.tenantId = req.user.tenantId;
    }
    const logs = await Log.find(query).populate('userId', 'name email role').populate('tenantId', 'name domain').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/tenants
router.get('/tenants', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ name: 1 });
    res.json(tenants);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/admin/create-tenant
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
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/dashboard
router.get('/dashboard', adminAuth, checkPermission(PERMISSIONS.VIEW_ANALYTICS), async (req, res) => {
  try {
    const isMaster = req.user.role === 'master_admin';
    const query = isMaster ? {} : { tenantId: req.user.tenantId };
    const totalUsers = await User.countDocuments(query);
    const totalProperties = await Property.countDocuments(query);
    const totalBookings = await Booking.countDocuments(query);
    const recentLogs = await Log.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).limit(5);
    const pendingProperties = await Property.countDocuments({ ...query, status: 'pending' });
    const featuredProperties = await Property.countDocuments({ ...query, isFeatured: true });
    res.json({ stats: { totalUsers, totalProperties, totalBookings, pendingProperties, featuredProperties }, recentLogs });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/users
router.get('/users', adminAuth, checkPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['user', 'owner'] } }).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/users/search
// @desc    Search user by email or phone
router.get('/users/search', adminAuth, checkPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  const { identifier } = req.query;
  try {
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/users/:id/block
router.put('/users/:id/block', adminAuth, checkPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !['user', 'owner'].includes(user.role)) return res.status(404).json({ msg: 'Valid user not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ msg: user.isBlocked ? 'User blocked' : 'User unblocked', isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', adminAuth, checkPermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !['user', 'owner'].includes(user.role)) return res.status(404).json({ msg: 'Valid user not found' });
    await Property.deleteMany({ ownerId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User and associated properties purged' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/properties
router.get('/properties', adminAuth, async (req, res) => {
  try {
    const properties = await Property.find().populate('ownerId', 'name email isBlocked').sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/properties/:id/approve
router.put('/properties/:id/approve', adminAuth, checkPermission(PERMISSIONS.APPROVE_PROPERTY), async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true }).populate('ownerId', 'name email isBlocked');
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/properties/:id
router.delete('/properties/:id', adminAuth, checkPermission(PERMISSIONS.DELETE_PROPERTY), async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    res.json({ msg: 'Property strictly deleted by Admin' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Staff Management Routes
router.get('/staff', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'employee', 'worker', 'master_admin'] } }).select('-passwordHash').sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/staff', adminAuth, masterAdminOnly, async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    if (!['admin', 'employee', 'worker'].includes(role)) return res.status(400).json({ msg: 'Invalid staff role.' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const effectivePermissions = (permissions && permissions.length > 0) ? permissions : ROLE_DEFAULTS[role] || [];
    const staff = new User({ name, email, passwordHash, role, permissions: effectivePermissions });
    await staff.save();
    const { passwordHash: _, ...safeStaff } = staff.toObject();
    res.status(201).json(safeStaff);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;
