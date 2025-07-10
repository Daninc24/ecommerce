const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  name: { type: String, default: 'Anonymous' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Testimonial', testimonialSchema); 