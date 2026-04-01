require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const EMAIL = 'akifullakhanpc@gmail.com';
const PASSWORD = 'admin123';
const NAME = 'Akifulla Khan K N';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent')
  .then(async () => {
    const existing = await User.findOne({ email: EMAIL });

    if (existing) {
      // Update to master_admin and reset password
      const hash = await bcrypt.hash(PASSWORD, 10);
      existing.role = 'master_admin';
      existing.passwordHash = hash;
      await existing.save();
      console.log(`✅ Existing user updated → role: master_admin, password: ${PASSWORD}`);
    } else {
      // Create fresh
      const hash = await bcrypt.hash(PASSWORD, 10);
      const user = new User({
        name: NAME,
        email: EMAIL,
        passwordHash: hash,
        role: 'master_admin',
        tenantId: null
      });
      await user.save();
      console.log(`✅ Master Admin created → email: ${EMAIL}, password: ${PASSWORD}`);
    }

    // List all users
    const users = await User.find({}, 'name email role');
    console.log('\n📋 All users in DB:');
    users.forEach(u => console.log(`  - ${u.name} (${u.email}) → ${u.role}`));
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
  });
