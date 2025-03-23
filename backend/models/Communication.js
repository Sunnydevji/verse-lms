const mongoose = require('mongoose');

const CommunicationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  message: {
    type: String,
    required: [true, 'Please provide a message']
  },
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread'
  },
  parentCommunication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Communication'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that either recipient or class is provided
CommunicationSchema.pre('save', function(next) {
  if (!this.recipient && !this.class) {
    throw new Error('Either recipient or class must be provided');
  }
  next();
});

module.exports = mongoose.model('Communication', CommunicationSchema);