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
router.post('/', uploadMultiple.array('images', 5), createProduct);
router.put('/:id', auth, admin, uploadMultiple.array('images', 5), updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

// Cleanup route for admin
router.post('/cleanup-missing-images', auth, admin, cleanupMissingImages);

module.exports = router; 