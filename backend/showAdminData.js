require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const Log = require('./models/Log');
const Tenant = require('./models/Tenant');

async function showAdminData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent');
    
    const users = await User.find({}, 'name email role isBlocked');
    const properties = await Property.find({}, 'title status isFeatured');
    const bookings = await Booking.find({}, 'status');
    const logs = await Log.find({}).limit(10).sort({ createdAt: -1 });
    const tenants = await Tenant.find({}, 'name domain');

    console.log('--- ADMIN DATA SUMMARY ---');
    console.log(`\nUSERS (${users.length}):`);
    users.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}] ${u.isBlocked ? '(BLOCKED)' : ''}`));

    console.log(`\nPROPERTIES (${properties.length}):`);
    properties.forEach(p => console.log(`  - ${p.title} [${p.status}] ${p.isFeatured ? '(FEATURED)' : ''}`));

    console.log(`\nBOOKINGS (${bookings.length}):`);
    const bookingStats = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    console.log(JSON.stringify(bookingStats, null, 2));

    console.log(`\nTENANTS (${tenants.length}):`);
    tenants.forEach(t => console.log(`  - ${t.name} (${t.domain})`));

    console.log(`\nRECENT LOGS (${logs.length}):`);
    logs.forEach(l => console.log(`  - [${l.createdAt.toISOString()}] ${l.action}`));

    process.exit(0);
  } catch (err) {
    console.error('Error fetching admin data:', err);
    process.exit(1);
  }
}

showAdminData();
