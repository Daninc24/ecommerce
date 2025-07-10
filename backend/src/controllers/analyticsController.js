const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const parseTimeRange = (range) => {
  const now = new Date();
  let start;
  switch (range) {
    case '7d':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      break;
    case '30d':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      break;
    case '90d':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  }
  return start;
};

exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const startDate = parseTimeRange(timeRange);
    const now = new Date();

    // Filtered totals
    const totalUsers = await User.countDocuments({ createdAt: { $gte: startDate, $lte: now } });
    const totalOrders = await Order.countDocuments({ createdAt: { $gte: startDate, $lte: now } });
    const totalProducts = await Product.countDocuments();
    const totalSalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: now } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    // Sales by month (within range)
    const salesByMonth = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: now } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User registrations by month (within range)
    const usersByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: now } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalSales,
      salesByMonth,
      usersByMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
}; 