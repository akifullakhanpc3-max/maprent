require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

// ─── CONFIGURE CREDENTIALS HERE ───────────────────────────
const STAFF_NAME     = 'Secondary Admin';
const STAFF_EMAIL    = 'staff@occupra.com';
const STAFF_PASSWORD = 'Staff@1234';
const STAFF_ROLE     = 'employee'; // 'admin' | 'employee' | 'worker'

// Permissions to grant (leave empty [] to use role defaults)
const STAFF_PERMISSIONS = [
  'VIEW_ANALYTICS',
  'APPROVE_PROPERTY',
  'REJECT_PROPERTY',
  'MANAGE_BOOKINGS',
];
// ──────────────────────────────────────────────────────────

async function createStaffAccount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent');
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: STAFF_EMAIL });
    if (existing) {
      console.log(`⚠️  Account already exists for ${STAFF_EMAIL} (role: ${existing.role})`);
      console.log('   Delete it first or change STAFF_EMAIL above.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(STAFF_PASSWORD, 10);

    const staff = new User({
      name:         STAFF_NAME,
      email:        STAFF_EMAIL,
      passwordHash,
      role:         STAFF_ROLE,
      permissions:  STAFF_PERMISSIONS,
    });

    await staff.save();

    console.log('\n🎉 Staff account created successfully!\n');
    console.log('─────────────────────────────────────');
    console.log(`  Name       : ${STAFF_NAME}`);
    console.log(`  Email      : ${STAFF_EMAIL}`);
    console.log(`  Password   : ${STAFF_PASSWORD}`);
    console.log(`  Role       : ${STAFF_ROLE}`);
    console.log(`  Permissions: ${STAFF_PERMISSIONS.join(', ')}`);
    console.log('─────────────────────────────────────');
    console.log('\n👉 Login at: /admin/login\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating staff account:', err.message);
    process.exit(1);
  }
}

createStaffAccount();
