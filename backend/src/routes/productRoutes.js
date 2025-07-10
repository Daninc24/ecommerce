const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventoryLogs
} = require('../controllers/productController');

// Debug middleware to log request details
const debugMiddleware = (req, res, next) => {
  console.log('=== ROUTE DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Body before multer:', req.body);
  console.log('Files before multer:', req.files);
  console.log('Route hit successfully!');
  next();
};

// Debug middleware after multer
const debugAfterMulter = (req, res, next) => {
  console.log('=== AFTER MULTER DEBUG ===');
  console.log('Body after multer:', req.body);
  console.log('Files after multer:', req.files);
  console.log('Multer processed successfully!');
  next();
};

// Public routes
router.get('/', getAllProducts);

// Test route to verify routing is working (must come before /:id)
router.get('/test', (req, res) => {
  console.log('=== TEST ROUTE HIT ===');
  res.json({ message: 'Test route working' });
});

// Admin/manager: Get inventory logs
router.get('/logs/:productId?', auth, admin, getInventoryLogs);

router.get('/:id', getProduct);

// Admin routes
router.post('/', debugMiddleware, uploadMultiple.array('images', 5), debugAfterMulter, createProduct);
router.put('/:id', auth, admin, uploadMultiple.array('images', 5), updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

module.exports = router; 