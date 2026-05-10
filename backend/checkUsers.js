import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent')
  .then(async () => {
    const users = await User.find({}, 'name email role tenantId');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  });
