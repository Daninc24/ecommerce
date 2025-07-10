const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here'
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const PaymentCredential = require('../models/PaymentCredential');
const { credentialCache, loadCredentials } = require('../utils/credentialCache');
const exchangeRates = require('../utils/exchangeRates');
const { sendOrderConfirmationEmail } = require('../utils/email');

// PayPal environment setup
const payPalEnv = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  ? new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : null;

const payPalClient = payPalEnv ? new paypal.core.PayPalHttpClient(payPalEnv) : null;

// Initial load
loadCredentials();

// Helper to reload credentials (call after update)
exports.reloadCredentials = loadCredentials;

// Stripe instance getter
function getStripe() {
  const key = credentialCache.stripe?.secretKey;
  return key ? require('stripe')(key) : null;
}

// PayPal client getter
function getPayPalClient() {
  const creds = credentialCache.paypal;
  if (!creds?.clientId || !creds?.clientSecret) return null;
  const paypalSDK = require('@paypal/checkout-server-sdk');
  const env = new paypalSDK.core.SandboxEnvironment(creds.clientId, creds.clientSecret);
  return new paypalSDK.core.PayPalHttpClient(env);
}

/**
 * STRIPE: Create Payment Intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(200).json({
        message: 'Stripe is not configured.',
        developmentMode: true,
        instructions: 'Set STRIPE_SECRET_KEY in .env or admin panel'
      });
    }

    const { items, currency = 'USD' } = req.body;
    const userId = req.user._id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmountUSD = 0;
    const orderItems = [];

    for (const item of items) {
      const productId = item.productId || item._id;
      const quantity = item.quantity || 1;
      const product = await Product.findById(productId);

      if (!product) return res.status(404).json({ message: `Product ${productId} not found` });
      if (product.stock < quantity) return res.status(400).json({ message: `Insufficient stock for ${product.title}` });

      orderItems.push({
        product: product._id,
        quantity,
        price: product.price
      });

      totalAmountUSD += product.price * quantity;
    }

    // Convert USD to local currency
    const rates = await exchangeRates.getRates();
    const rate = rates[currency] || 1;
    const localAmount = totalAmountUSD * rate;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(localAmount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        userId: userId.toString(),
        items: JSON.stringify(orderItems.map(item => ({
          productId: item.product.toString(),
          quantity: item.quantity
        }))),
        usdAmount: totalAmountUSD
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmountUSD,
      localAmount,
      currency
    });

  } catch (error) {
    res.status(500).json({ message: 'Error creating payment intent', error: error.message });
  }
};

/**
 * STRIPE: Confirm Payment
 */
const confirmPayment = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(200).json({ message: 'Stripe is not configured.' });

    const { paymentIntentId, items, shippingAddress } = req.body;
    const userId = req.user._id;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') return res.status(400).json({ message: 'Payment not completed' });
    if (paymentIntent.metadata.userId !== userId.toString()) return res.status(403).json({ message: 'Unauthorized payment' });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.title}` });

      product.stock -= item.quantity;
      product.salesCount = (product.salesCount || 0) + item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Get currency and amounts from payment intent
    const currency = paymentIntent.currency?.toUpperCase() || 'USD';
    const localAmount = paymentIntent.amount / 100;
    const usdAmount = paymentIntent.metadata?.usdAmount ? Number(paymentIntent.metadata.usdAmount) : totalAmount;

    const order = new Order({
      userId,
      items: orderItems,
      totalAmount: localAmount,
      currency,
      localAmount,
      usdAmount,
      status: 'paid',
      paymentIntentId,
      shippingAddress: shippingAddress || {}
    });

    await order.save();
    await order.populate('items.product');

    // Send order confirmation email
    try {
      const user = await require('../models/User').findById(userId);
      if (user && user.email) {
        const html = `
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Total Paid:</strong> ${order.localAmount && order.currency && order.currency !== 'USD' ? `${order.localAmount} ${order.currency} / $${order.usdAmount} USD` : `$${order.usdAmount || order.totalAmount} USD`}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p>We appreciate your business.</p>
        `;
        await sendOrderConfirmationEmail({
          to: user.email,
          subject: 'Order Confirmation',
          html
        });
      }
    } catch (e) { /* fail silently */ }

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
};

/**
 * STRIPE: Get Payment Status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(200).json({ message: 'Stripe is not configured.' });

    const { paymentIntentId } = req.params;
    const userId = req.user._id;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== userId.toString()) return res.status(403).json({ message: 'Unauthorized' });

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving payment status', error: error.message });
  }
};

/**
 * PAYPAL: Create PayPal Order
 */
const createPayPalOrder = async (req, res) => {
  const payPalClient = getPayPalClient();
  if (!payPalClient) {
    return res.status(500).json({ message: 'PayPal not configured.' });
  }
  try {
    const { totalAmount, currency = 'USD' } = req.body;
    // Recalculate local amount from USD using backend rates
    const rates = await exchangeRates.getRates();
    const rate = rates[currency] || 1;
    const localAmount = totalAmount * rate;
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: localAmount ? localAmount.toFixed(2) : '0.00',
        },
      }],
    });
    const order = await payPalClient.execute(request);
    res.json({ id: order.result.id, localAmount, currency });
  } catch (err) {
    res.status(500).json({ message: 'Error creating PayPal order', error: err.message });
  }
};

/**
 * PAYPAL: Capture PayPal Order
 */
const capturePayPalOrder = async (req, res) => {
  const payPalClient = getPayPalClient();
  if (!payPalClient) {
    return res.status(500).json({ message: 'PayPal not configured.' });
  }
  try {
    const { orderID } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await payPalClient.execute(request);
    res.json({ status: capture.result.status, details: capture.result });
  } catch (err) {
    res.status(500).json({ message: 'Error capturing PayPal order', error: err.message });
  }
};

/**
 * MPESA: Initiate Mpesa Payment (Sandbox)
 */
const initiateMpesaPayment = async (req, res) => {
  const { phone, amount } = req.body;
  const creds = credentialCache.mpesa;
  const consumerKey = creds.consumerKey;
  const consumerSecret = creds.consumerSecret;
  const shortcode = creds.shortcode;
  const passkey = creds.passkey;

  if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
    return res.status(500).json({ message: 'Mpesa not configured properly in .env.' });
  }

  if (!phone || !amount) {
    return res.status(400).json({ message: 'Phone and amount are required.' });
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    const accessToken = tokenRes.data.access_token;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: 'https://yourdomain.com/api/payment/mpesa/callback',
      AccountReference: 'MyShoppingCenter',
      TransactionDesc: 'Order Payment'
    };

    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      MerchantRequestID: stkRes.data.MerchantRequestID,
      CheckoutRequestID: stkRes.data.CheckoutRequestID,
      ResponseDescription: stkRes.data.ResponseDescription
    });
  } catch (err) {
    res.status(500).json({ message: 'Error initiating Mpesa payment', error: err.message });
  }
};

/**
 * MPESA: Stub Confirm Mpesa Payment
 */
const confirmMpesaPayment = async (req, res) => {
  res.json({ message: 'Mpesa confirmation endpoint (stub)' });
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  createPayPalOrder,
  capturePayPalOrder,
  initiateMpesaPayment,
  confirmMpesaPayment
};
