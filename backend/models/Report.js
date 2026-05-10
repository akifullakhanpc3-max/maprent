import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: ['Spam', 'Fake Listing', 'Incorrect Info', 'Offensive Content', 'Other'],
  },
  details: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;
