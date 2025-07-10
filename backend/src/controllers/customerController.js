const Customer = require('../models/Customer');

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
    let customer = await Customer.findOne({ phone });
    if (customer) return res.status(409).json({ message: 'Customer already exists', customer });
    customer = await Customer.create({ name, phone, email });
    res.status(201).json({ customer });
  } catch (error) {
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

exports.searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    } : {};
    const customers = await Customer.find(query).limit(20).sort({ createdAt: -1 });
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ message: 'Error searching customers', error: error.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ customer });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, loyaltyPoints } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, email, loyaltyPoints },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ customer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

exports.listCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).limit(100);
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ message: 'Error listing customers', error: error.message });
  }
}; 