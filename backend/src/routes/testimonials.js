const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');

router.post('/', testimonialController.addTestimonial);
router.get('/', testimonialController.getTestimonials);

module.exports = router; 