const express = require('express');
const router = express.Router();
const { getAllCredentials, getCredential, upsertCredential } = require('../controllers/paymentCredentialController');
const { auth, admin } = require('../middleware/auth');

// Get all credentials (admin only)
router.get('/', auth, admin, getAllCredentials);
// Get credential for a specific gateway (admin only)
router.get('/:gateway', auth, admin, getCredential);
// Upsert credential for a specific gateway (admin only)
router.put('/:gateway', auth, admin, upsertCredential);

module.exports = router; 