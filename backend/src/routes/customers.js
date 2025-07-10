const express = require('express');
const router = express.Router();
const { createCustomer, searchCustomers, getCustomer, updateCustomer, listCustomers } = require('../controllers/customerController');
const { auth } = require('../middleware/auth');

router.post('/', auth, createCustomer);
router.get('/search', auth, searchCustomers);
router.get('/:id', auth, getCustomer);
router.put('/:id', auth, updateCustomer);
router.get('/', auth, listCustomers);

module.exports = router; 