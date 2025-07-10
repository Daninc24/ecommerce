const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a sale (checkout)
exports.createSale = async (req, res) => {
  try {
    const { items, total, paymentMethod } = req.body;
    const shopkeeper = req.user._id;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in sale' });
    }
    // Optionally, validate products and update inventory
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock !== undefined && product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      if (product.stock !== undefined) {
        product.stock -= item.quantity;
        await product.save();
      }
      item.name = product.name;
      item.price = product.price;
      item.subtotal = product.price * item.quantity;
    }
    const sale = await Sale.create({ shopkeeper, items, total, paymentMethod });
    res.status(201).json({ message: 'Sale completed', sale });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sale', error: error.message });
  }
};

// List sales (admin: all, shopkeeper: own)
exports.listSales = async (req, res) => {
  try {
    let sales;
    if (req.user.role === 'admin') {
      sales = await Sale.find().populate('shopkeeper', 'name email').sort({ createdAt: -1 });
    } else if (req.user.role === 'shopkeeper') {
      sales = await Sale.find({ shopkeeper: req.user._id }).populate('shopkeeper', 'name email').sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales', error: error.message });
  }
};

// Sales summary (daily, weekly, monthly)
exports.getSalesSummary = async (req, res) => {
  try {
    const { period = 'daily' } = req.query; // 'daily', 'weekly', 'monthly'
    let groupFormat;
    if (period === 'monthly') groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    else if (period === 'weekly') groupFormat = { $isoWeek: '$createdAt' };
    else groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const summary = await Sale.aggregate([
      { $group: {
        _id: groupFormat,
        totalSales: { $sum: '$total' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales summary', error: error.message });
  }
};

// Sales by shopkeeper
exports.getSalesByShopkeeper = async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      { $group: {
        _id: '$shopkeeper',
        totalSales: { $sum: '$total' },
        count: { $sum: 1 }
      }},
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'shopkeeper'
      }},
      { $unwind: '$shopkeeper' },
      { $project: { _id: 1, totalSales: 1, count: 1, name: '$shopkeeper.name', email: '$shopkeeper.email' } },
      { $sort: { totalSales: -1 } }
    ]);
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales by shopkeeper', error: error.message });
  }
};

// Sales by product
exports.getSalesByProduct = async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalSales: { $sum: '$items.subtotal' }
      }},
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $project: { _id: 1, totalSold: 1, totalSales: 1, name: '$product.name' } },
      { $sort: { totalSold: -1 } }
    ]);
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales by product', error: error.message });
  }
};

// Sales by payment method
exports.getSalesByPaymentMethod = async (req, res) => {
  try {
    const sales = await Sale.aggregate([
      { $group: {
        _id: '$paymentMethod',
        totalSales: { $sum: '$total' },
        count: { $sum: 1 }
      }},
      { $sort: { totalSales: -1 } }
    ]);
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales by payment method', error: error.message });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('shopkeeper', 'name email').populate('items.product', 'name title');
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json({ sale });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sale', error: error.message });
  }
};

// Process a return/refund
exports.processReturn = async (req, res) => {
  try {
    const { saleId, items, reason } = req.body;
    const originalSale = await Sale.findById(saleId);
    if (!originalSale) return res.status(404).json({ message: 'Original sale not found' });
    // Validate items and quantities
    for (const item of items) {
      const origItem = originalSale.items.find(i => i.product.toString() === item.product);
      if (!origItem || item.quantity > origItem.quantity) {
        return res.status(400).json({ message: 'Invalid return quantity for product' });
      }
    }
    // Create negative sale (return)
    const returnItems = [];
    let totalRefund = 0;
    for (const item of items) {
      const origItem = originalSale.items.find(i => i.product.toString() === item.product);
      const refundSubtotal = origItem.price * item.quantity;
      returnItems.push({
        product: item.product,
        name: origItem.name,
        price: origItem.price,
        quantity: -item.quantity,
        subtotal: -refundSubtotal
      });
      // Update inventory
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      totalRefund += refundSubtotal;
    }
    const returnSale = await Sale.create({
      shopkeeper: req.user._id,
      items: returnItems,
      total: -totalRefund,
      paymentMethod: originalSale.paymentMethod,
      createdAt: new Date(),
      isReturn: true,
      originalSale: saleId,
      reason
    });
    res.status(201).json({ returnSale });
  } catch (error) {
    res.status(500).json({ message: 'Error processing return', error: error.message });
  }
};

// Z-Report: Daily sales summary
exports.getZReport = async (req, res) => {
  try {
    const { date, shopkeeper } = req.query;
    const start = date ? new Date(date) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const match = {
      createdAt: { $gte: start, $lt: end },
    };
    if (shopkeeper) match.shopkeeper = mongoose.Types.ObjectId(shopkeeper);
    const sales = await Sale.find({ ...match, isReturn: { $ne: true } });
    const returns = await Sale.find({ ...match, isReturn: true });
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalReturns = returns.reduce((sum, s) => sum + Math.abs(s.total), 0);
    const netSales = totalSales - totalReturns;
    const paymentBreakdown = {};
    for (const s of sales) {
      paymentBreakdown[s.paymentMethod] = (paymentBreakdown[s.paymentMethod] || 0) + s.total;
    }
    for (const r of returns) {
      paymentBreakdown[r.paymentMethod] = (paymentBreakdown[r.paymentMethod] || 0) - Math.abs(r.total);
    }
    res.json({
      date: start.toISOString().slice(0, 10),
      shopkeeper,
      totalSales,
      totalReturns,
      netSales,
      paymentBreakdown,
      salesCount: sales.length,
      returnsCount: returns.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Z-report', error: error.message });
  }
};

// Performance dashboard: sales by staff, top products, payment breakdown
exports.getPerformanceDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      match.createdAt = match.createdAt || {};
      match.createdAt.$lte = new Date(endDate);
    }
    // Sales by staff
    const salesByStaff = await Sale.aggregate([
      { $match: { ...match, isReturn: { $ne: true } } },
      { $group: {
        _id: '$shopkeeper',
        totalSales: { $sum: '$total' },
        count: { $sum: 1 }
      }},
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'shopkeeper'
      }},
      { $unwind: '$shopkeeper' },
      { $project: { _id: 1, totalSales: 1, count: 1, name: '$shopkeeper.name', email: '$shopkeeper.email' } },
      { $sort: { totalSales: -1 } }
    ]);
    // Top products
    const topProducts = await Sale.aggregate([
      { $match: { ...match, isReturn: { $ne: true } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalSales: { $sum: '$items.subtotal' }
      }},
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }},
      { $unwind: '$product' },
      { $project: { _id: 1, totalSold: 1, totalSales: 1, name: '$product.name', title: '$product.title' } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    // Payment breakdown
    const paymentAgg = await Sale.aggregate([
      { $match: { ...match } },
      { $group: {
        _id: '$paymentMethod',
        total: { $sum: '$total' }
      }}
    ]);
    const paymentBreakdown = {};
    for (const p of paymentAgg) {
      paymentBreakdown[p._id] = p.total;
    }
    res.json({ salesByStaff, topProducts, paymentBreakdown });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance dashboard', error: error.message });
  }
}; 