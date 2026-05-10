import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';

const EMAIL = process.env.MASTER_ADMIN_EMAIL;
const PASSWORD = process.env.MASTER_ADMIN_PASSWORD;
const NAME = 'Akifulla Khan K N';

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const existing = await User.findOne({ email: EMAIL });

    if (existing) {
      // Update to master_admin and reset password
      const hash = await bcrypt.hash(PASSWORD, 10);
      existing.role = 'master_admin';
      existing.passwordHash = hash;
      await existing.save();
      console.log(`✅ Existing user updated → role: master_admin, email: ${EMAIL}`);
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
      console.log(`✅ Master Admin created → email: ${EMAIL}`);
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
