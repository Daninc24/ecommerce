const PaymentCredential = require('../models/PaymentCredential');
const { loadCredentials } = require('../utils/credentialCache');

// Get credentials for all gateways
exports.getAllCredentials = async (req, res) => {
  try {
    const credentials = await PaymentCredential.find({}, '-__v');
    res.json(credentials);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch credentials', error: err.message });
  }
};

// Get credentials for a specific gateway
exports.getCredential = async (req, res) => {
  try {
    const { gateway } = req.params;
    const credential = await PaymentCredential.findOne({ gateway });
    if (!credential) return res.status(404).json({ message: 'Credential not found' });
    res.json(credential);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch credential', error: err.message });
  }
};

// Update or create credentials for a gateway
exports.upsertCredential = async (req, res) => {
  try {
    const { gateway } = req.params;
    const { credentials } = req.body;
    if (!credentials) return res.status(400).json({ message: 'Missing credentials' });
    const updated = await PaymentCredential.findOneAndUpdate(
      { gateway },
      { credentials, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await loadCredentials();
    res.json(updated);
  } catch (err) {
    console.error('Failed to update credential:', err);
    res.status(500).json({ message: 'Failed to update credential', error: err.message, stack: err.stack });
  }
}; 