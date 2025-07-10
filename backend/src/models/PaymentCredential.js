const mongoose = require('mongoose');

const paymentCredentialSchema = new mongoose.Schema({
  gateway: {
    type: String,
    enum: ['stripe', 'paypal', 'mpesa'],
    required: true,
    unique: true
  },
  credentials: {
    type: mongoose.Schema.Types.Mixed, // Flexible for different gateway fields
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentCredential', paymentCredentialSchema); 