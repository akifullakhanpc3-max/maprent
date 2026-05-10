import 'dotenv/config';
import mongoose from 'mongoose';
import Property from './models/Property.js';

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
