const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  shopkeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [saleItemSchema],
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile'], required: true },
  createdAt: { type: Date, default: Date.now },
  isReturn: { type: Boolean, default: false },
  originalSale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  reason: { type: String, default: '' }
});

module.exports = mongoose.model('Sale', saleSchema); 