const express = require('express');
const router = express.Router();
const { 
  placeOrder, 
  getUserOrders, 
  getAllOrders, 
  updateOrderStatus 
} = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

// User routes
router.post('/', auth, placeOrder);
router.get('/', auth, getUserOrders);

// Admin routes - using different patterns to avoid conflicts
router.get('/all', auth, admin, getAllOrders);
router.put('/:id/status', auth, admin, updateOrderStatus);

module.exports = router; 