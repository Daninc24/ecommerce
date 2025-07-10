const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { auth, admin } = require('../middleware/auth');

// Create a sale (shopkeeper or admin)
router.post('/sales', auth, posController.createSale);

// List sales (admin: all, shopkeeper: own)
router.get('/sales', auth, posController.listSales);

// Sales reporting (admin only)
router.get('/sales/summary', auth, admin, posController.getSalesSummary);
router.get('/sales/by-shopkeeper', auth, admin, posController.getSalesByShopkeeper);
router.get('/sales/by-product', auth, admin, posController.getSalesByProduct);
router.get('/sales/by-payment-method', auth, admin, posController.getSalesByPaymentMethod);
router.get('/sales/:id', auth, posController.getSaleById);
router.post('/sales/return', auth, posController.processReturn);

// Z-report (daily sales summary)
router.get('/z-report', posController.getZReport);

// Performance dashboard
router.get('/performance-dashboard', posController.getPerformanceDashboard);

module.exports = router; 