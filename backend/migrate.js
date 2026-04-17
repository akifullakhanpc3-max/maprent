const mongoose = require('mongoose');
require('dotenv').config();
const Property = require('./models/Property');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const result = await Property.collection.updateMany(
      { rent: { $exists: true } },
      { $rename: { 'rent': 'price' } }
    );
    console.log('Migrated properties:', result.modifiedCount);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
