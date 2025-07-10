const axios = require('axios');

let cachedRates = null;
let lastFetched = 0;

const API_URL = 'https://open.er-api.com/v6/latest/USD'; // Free public endpoint

async function getRates() {
  const now = Date.now();
  if (!cachedRates || now - lastFetched > 60 * 60 * 1000) { // refresh every hour
    const res = await axios.get(API_URL);
    cachedRates = res.data.rates;
    lastFetched = now;
  }
  return cachedRates;
}

async function convertToUSD(amount, currency) {
  const rates = await getRates();
  if (!rates[currency]) throw new Error('Unsupported currency');
  return amount / rates[currency];
}

async function listSupportedCurrencies() {
  const rates = await getRates();
  return Object.keys(rates);
}

module.exports = { getRates, convertToUSD, listSupportedCurrencies }; 