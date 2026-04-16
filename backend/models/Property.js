const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false,
    default: null,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  rent: {
    type: Number,
    required: true,
    index: true,
  },
  bhkType: {
    type: String,
    required: true,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Villa'],
    index: true,
  },
  city: {
    type: String,
    required: true,
    index: true,
  },
  amenities: {
    type: [String],
    default: [],
  },
  images: {
    type: [String],
    default: [],
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
  },
  video: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    required: true,
  },
  whatsapp: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    }
  },
  allowedFor: {
    type: [String],
    enum: ['Bachelors', 'Family', 'Couples'],
    default: ['Bachelors', 'Family', 'Couples'],
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

// Create a 2dsphere index on the location field to enable geospatial queries
propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);
