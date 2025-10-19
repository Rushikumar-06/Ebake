const express = require('express');
const Order = require('../models/Order');
const Cake = require('../models/Cake');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: { $in: ['Pending', 'Order Placed'] } });
    const completedOrders = await Order.countDocuments({ status: 'Completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

    // Get total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get cake statistics
    const totalCakes = await Cake.countDocuments();
    const availableCakes = await Cake.countDocuments({ isAvailable: true });

    // Get recent orders (last 5)
    const recentOrders = await Order.find()
      .populate('items.cakeId', 'name')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);


    // Get orders by status for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { 
        $match: { 
          status: 'Completed',
          createdAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          totalCakes,
          availableCakes
        },
        recentOrders,
        charts: {
          ordersByStatus,
          monthlyRevenue
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get admin profile
router.get('/profile', async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin profile'
    });
  }
});

// Update admin profile
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

module.exports = router;
