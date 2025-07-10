const PaymentCredential = require('../models/PaymentCredential');

let credentialCache = {
  stripe: null,
  paypal: null,
  mpesa: null,
  google: null
};

async function loadCredentials() {
  const creds = await PaymentCredential.find({});
  creds.forEach(c => {
    credentialCache[c.gateway] = c.credentials;
  });
  // Fallback to .env if not in DB
  if (!credentialCache.stripe) {
    credentialCache.stripe = { secretKey: process.env.STRIPE_SECRET_KEY };
  }
  if (!credentialCache.paypal) {
    credentialCache.paypal = {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET
    };
  }
  if (!credentialCache.mpesa) {
    credentialCache.mpesa = {
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      shortcode: process.env.MPESA_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY
    };
  }
  if (!credentialCache.google) {
    credentialCache.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    };
  }
}

module.exports = {
  credentialCache,
  loadCredentials
}; 