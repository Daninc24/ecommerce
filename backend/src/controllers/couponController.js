const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, usageLimit, validFrom, validTo } = req.body;
    if (!code || !type || !value) return res.status(400).json({ message: 'Missing required fields' });
    const coupon = await Coupon.create({ code, type, value, usageLimit, validFrom, validTo });
    res.status(201).json({ coupon });
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

exports.listCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ message: 'Error listing coupons', error: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const now = new Date();
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found or inactive' });
    if (coupon.validFrom && now < coupon.validFrom) return res.status(400).json({ message: 'Coupon not yet valid' });
    if (coupon.validTo && now > coupon.validTo) return res.status(400).json({ message: 'Coupon expired' });
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: 'Coupon usage limit reached' });
    res.json({ coupon });
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon', error: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ coupon });
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
};

exports.deactivateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, { active: false }, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ coupon });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating coupon', error: error.message });
  }
};

exports.incrementUsage = async (code) => {
  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}; 