const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  bhkType: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+', 'Studio', 'PG'],
    required: true
  },
  amenities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  whatsapp: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      index: '2dsphere'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);

