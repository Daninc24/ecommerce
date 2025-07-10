const express = require('express');
const router = express.Router();
const { createCoupon, listCoupons, validateCoupon, updateCoupon, deactivateCoupon } = require('../controllers/couponController');
const { auth, admin } = require('../middleware/auth');

router.post('/', auth, admin, createCoupon);
router.get('/', auth, admin, listCoupons);
router.post('/validate', auth, validateCoupon);
router.put('/:id', auth, admin, updateCoupon);
router.post('/:id/deactivate', auth, admin, deactivateCoupon);

module.exports = router; 