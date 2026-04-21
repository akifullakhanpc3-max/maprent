require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/Property');

async function approveAllProperties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent');
    
    const result = await Property.updateMany(
      { status: 'pending' },
      { $set: { status: 'approved', isActive: true } }
    );
    
    console.log(`Successfully approved ${result.modifiedCount} properties.`);
    process.exit(0);
  } catch (err) {
    console.error('Error approving properties:', err);
    process.exit(1);
  }
}

approveAllProperties();
