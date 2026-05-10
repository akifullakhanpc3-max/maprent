import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const users = await User.find({}, 'name email role tenantId');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  });
