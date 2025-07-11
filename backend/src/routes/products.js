const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getBestSellingProducts,
  getInventoryLogs,
  cleanupMissingImages
} = require('../controllers/productController');
const { auth, admin } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const Product = require('../models/Product');

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

// Test route to verify routing is working (must come before /:id)
router.get('/test', (req, res) => {
  console.log('=== TEST ROUTE HIT ===');
  res.json({ message: 'Test route working' });
});

// Public routes
router.get('/', getAllProducts);
router.get('/best-selling', getBestSellingProducts);
// Admin/manager: Get inventory logs
router.get('/logs/:productId?', auth, admin, getInventoryLogs);

router.get('/:id', getProduct);
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Admin only routes
router.post('/', debugMiddleware, uploadMultiple.array('images', 5), debugAfterMulter, createProduct);
router.put('/:id', auth, admin, uploadMultiple.array('images', 5), updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

// Cleanup route for admin
router.post('/cleanup-missing-images', auth, admin, cleanupMissingImages);

module.exports = router; 