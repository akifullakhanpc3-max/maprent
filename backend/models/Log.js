const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  metadata: {
    type: Object,
    default: {},
  }
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);
