require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.log('\n❌ Error: Please provide an email address.');
  console.log('Usage: node makeAdmin.js <user-email>\n');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent')
  .then(async () => {
    console.log(`\n🔍 Searching for user: ${emailToPromote}...`);
    
    const user = await User.findOneAndUpdate(
      { email: emailToPromote },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`✅ Success! [${user.name}] (${user.email}) has been permanently promoted to Admin.`);
      console.log(`🔐 They can now access the secure /admin React portal!`);
    } else {
      console.log('❌ User not found. Are you sure they are registered?');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
