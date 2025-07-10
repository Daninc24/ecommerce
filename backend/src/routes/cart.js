const express = require('express');
const router = express.Router();
const { 
  addToCart, 
  getCart, 
  removeFromCart, 
  updateQuantity,
  clearCart 
} = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

// All cart routes require authentication
// Order matters: specific routes first, then parameterized routes
router.post('/', auth, addToCart);
router.get('/', auth, getCart);
router.put('/:productId', auth, updateQuantity); // Update quantity route
router.delete('/', auth, clearCart); // Clear cart route
router.delete('/:productId', auth, removeFromCart); // Remove specific item

module.exports = router; 