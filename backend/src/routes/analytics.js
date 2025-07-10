const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { auth, admin } = require('../middleware/auth');

router.get('/', auth, admin, getAnalytics);

module.exports = router; 