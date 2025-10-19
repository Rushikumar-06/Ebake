const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cake = require('../models/Cake');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateOrder, validateAddress } = require('../middleware/validation');

const router = express.Router();

// Create new order
router.post('/', authenticateToken, validateOrder, async (req, res) => {
  try {
    const { items, customerInfo, deliveryAddress, notes, estimatedDelivery } = req.body;
    const userId = req.user._id;

    // Check if user is admin - admins cannot place orders
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot place orders. Please use a customer account.'
      });
    }

    // Validate delivery date - must be at least 1 day from now
    const deliveryDate = new Date(estimatedDelivery);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (deliveryDate < tomorrow) {
      return res.status(400).json({
        success: false,
        message: 'Delivery date must be at least 1 day from today'
      });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const cake = await Cake.findById(item.cakeId);
      if (!cake) {
        return res.status(400).json({
          success: false,
          message: `Cake with ID ${item.cakeId} not found`
        });
      }

      if (!cake.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Cake "${cake.name}" is currently unavailable`
        });
      }

      // Find the correct price for the selected weight
      const weightOption = cake.weightOptions.find(
        option => option.weight === item.weight
      );

      if (!weightOption) {
        return res.status(400).json({
          success: false,
          message: `Weight option "${item.weight}" not available for "${cake.name}"`
        });
      }

      const itemTotal = weightOption.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        cakeId: item.cakeId,
        quantity: item.quantity,
        weight: item.weight,
        price: weightOption.price
      });
    }

    // Create order
    const order = new Order({
      userId,
      items: validatedItems,
      totalAmount,
      customerInfo,
      deliveryAddress,
      notes,
      estimatedDelivery: deliveryDate,
      status: 'Order Placed'
    });

    await order.save();

    // Populate the order with cake and user details
    await order.populate('items.cakeId', 'name flavor imageUrl');
    await order.populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error placing order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.cakeId', 'name flavor imageUrl')
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

// Admin routes - placed before /:id route to prevent path conflicts

// Get all orders (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (status) {
      // Handle "Pending" filter to include both "Pending" and "Order Placed" statuses
      if (status === 'Pending') {
        filter.status = { $in: ['Pending', 'Order Placed'] };
      } else {
        filter.status = status;
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      // Search in customer name or phone
      filter.$or = [
        { 'customerInfo.name': { $regex: search, $options: 'i' } },
        { 'customerInfo.phone': { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.cakeId', 'name flavor imageUrl')
      .populate('userId', 'name email phone')
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders for admin'
    });
  }
});

// Get single order by ID (user can only see their own orders)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    // Build query based on user role
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }
    
    const order = await Order.findOne(query)
      .populate('items.cakeId', 'name flavor imageUrl flavors')
      .populate('userId', 'name email phone');
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching order details'
    });
  }
});

// Update order status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    if (!['Order Placed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Order Placed, Completed, or Cancelled'
      });
    }

    // If cancelling order, require cancellation reason
    if (status === 'Cancelled' && (!cancellationReason || cancellationReason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required when cancelling an order'
      });
    }

    // Prepare update object
    const updateData = { status };
    if (status === 'Cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason.trim();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('items.cakeId', 'name flavor imageUrl')
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: status === 'Cancelled' 
        ? `Order cancelled successfully with reason: ${cancellationReason}`
        : `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
});

module.exports = router;
