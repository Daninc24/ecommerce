const express = require('express');
const router = express.Router();
const { 
  createPaymentIntent, 
  confirmPayment, 
  getPaymentStatus,
  createPayPalOrder,
  capturePayPalOrder,
  initiateMpesaPayment,
  confirmMpesaPayment
} = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');
const exchangeRates = require('../utils/exchangeRates');

// Payment routes
router.post('/create-payment-intent', auth, createPaymentIntent);
router.post('/confirm-payment', auth, confirmPayment);
router.get('/status/:paymentIntentId', auth, getPaymentStatus);
router.post('/paypal/create-order', auth, createPayPalOrder);
router.post('/paypal/capture-order', auth, capturePayPalOrder);
router.post('/mpesa/initiate', auth, initiateMpesaPayment);
router.post('/mpesa/confirm', auth, confirmMpesaPayment);

// Get all exchange rates
router.get('/currency/rates', async (req, res) => {
  try {
    const rates = await exchangeRates.getRates();
    res.json({ rates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// Get supported currencies
router.get('/currency/list', async (req, res) => {
  try {
    const currencies = await exchangeRates.listSupportedCurrencies();
    res.json({ currencies });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch currency list' });
  }
});

module.exports = router; 