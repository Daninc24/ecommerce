const mongoose = require('mongoose');

const advertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  image: { type: String, default: '' },
  template: { type: String, default: 'classic' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('Advert', advertSchema); 