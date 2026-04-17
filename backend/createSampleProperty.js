require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');

async function createSampleProperty() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent');
    
    // Find an owner
    const owner = await User.findOne({ role: { $in: ['user', 'owner'] } });
    if (!owner) {
      console.error('No suitable owner found. Please register a user first.');
      process.exit(1);
    }

    const sampleProperty = new Property({
      ownerId: owner._id,
      title: 'Sample Urban Apartment',
      description: 'A premium 2BHK apartment with city views and modern amenities.',
      price: 45000,
      securityDeposit: 90000,
      maintenance: 3000,
      negotiable: true,
      bhkType: '2BHK',
      city: 'Bangalore',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716]
      },
      status: 'pending',
      phone: '9876543210',
      whatsapp: '9876543210',
      amenities: ['Wifi', 'Parking', 'Gym', 'Security']
    });

    await sampleProperty.save();
    console.log(`Sample property created: ${sampleProperty.title} (ID: ${sampleProperty._id})`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating sample property:', err);
    process.exit(1);
  }
}

createSampleProperty();
