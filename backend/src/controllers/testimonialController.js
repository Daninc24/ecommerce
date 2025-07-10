const Testimonial = require('../models/Testimonial');

// POST /api/testimonials
exports.addTestimonial = async (req, res) => {
  try {
    const { rating, message, name } = req.body;
    if (!rating || !message) return res.status(400).json({ message: 'Rating and message are required.' });
    const testimonial = await Testimonial.create({ rating, message, name });
    res.status(201).json({ testimonial });
  } catch (error) {
    res.status(500).json({ message: 'Error saving testimonial', error: error.message });
  }
};

// GET /api/testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).limit(12);
    res.json({ testimonials });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching testimonials', error: error.message });
  }
}; 