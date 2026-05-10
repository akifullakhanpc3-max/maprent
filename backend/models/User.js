import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  firebaseUid: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'owner', 'admin', 'employee', 'worker', 'master_admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    required: false,
  },
  permissions: {
    type: [String],
    default: [],
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  savedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: []
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
