const express = require('express');
const mongoose = require('mongoose');
const Cake = require('../models/Cake');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateCake } = require('../middleware/validation');
const { upload, handleUploadError, deleteImage } = require('../middleware/upload');

const router = express.Router();

// Get all cakes with filtering, searching, and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database connection not ready. Please try again.'
      });
    }

    const {
      page = 1,
      limit = 12,
      search,
      flavor,
      minPrice,
      maxPrice,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate and sanitize input parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12)); // Cap at 50 for performance
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = { isAvailable: true };
    const flavorConditions = [];

    // Search filter - use regex search for better compatibility
    if (search && typeof search === 'string' && search.trim()) {
      // Escape special regex characters to prevent injection
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchConditions = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { flavor: { $regex: escapedSearch, $options: 'i' } }
      ];
      
      // Handle existing conditions properly
      if (filter.$or) {
        filter.$and = [filter.$or, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // Flavor filter - search in both single flavor and flavors array
    if (flavor && typeof flavor === 'string' && flavor.trim()) {
      const escapedFlavor = flavor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      flavorConditions.push(
        { flavor: { $regex: escapedFlavor, $options: 'i' } },
        { flavors: { $in: [new RegExp(escapedFlavor, 'i')] } }
      );
    }

    // Price range filter with validation
    if (minPrice || maxPrice) {
      filter.price = {};
      const minPriceVal = parseFloat(minPrice);
      const maxPriceVal = parseFloat(maxPrice);
      
      if (minPrice && !isNaN(minPriceVal) && minPriceVal >= 0) {
        filter.price.$gte = minPriceVal;
      }
      if (maxPrice && !isNaN(maxPriceVal) && maxPriceVal >= 0) {
        filter.price.$lte = maxPriceVal;
      }
      
      // Remove price filter if no valid values
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    // Category filter
    if (category && typeof category === 'string' && category.trim()) {
      filter.category = category.trim();
    }

    // Sort configuration with validation
    const allowedSortFields = ['createdAt', 'name', 'price', 'category'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortConfig = {};
    sortConfig[validSortBy] = sortOrder === 'asc' ? 1 : -1;

    // Apply flavor conditions to filter
    if (flavorConditions.length > 0) {
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: flavorConditions });
      } else {
        filter.$or = flavorConditions;
      }
    }

    // Execute queries in parallel for better performance
    const [cakes, totalCakes] = await Promise.all([
      Cake.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean() // Use lean() for better performance when not modifying documents
        .exec()
        .catch(err => {
          console.error('Cake.find error:', err);
          throw err;
        }),
      Cake.countDocuments(filter)
        .catch(err => {
          console.error('Cake.countDocuments error:', err);
          throw err;
        })
    ]);

    const totalPages = Math.ceil(totalCakes / limitNum);

    // Only fetch filter options if no search/filter is applied (to avoid unnecessary queries)
    let availableFlavors = [];
    let availableCategories = [];
    
    if (!search && !flavor && !minPrice && !maxPrice && !category) {
      try {
        // Fetch filter options in parallel with simplified queries
        [availableFlavors, availableCategories] = await Promise.all([
          // Simplified flavor query - just get distinct values
          Promise.all([
            Cake.distinct('flavor', { isAvailable: true, flavor: { $exists: true, $ne: null } }),
            Cake.find({ isAvailable: true, flavors: { $exists: true, $not: { $size: 0 } } }, { flavors: 1 }).lean()
          ]).then(([singleFlavors, flavorDocs]) => {
            const arrayFlavors = [...new Set(flavorDocs.flatMap(doc => doc.flavors || []))];
            return [...new Set([...singleFlavors, ...arrayFlavors])].filter(Boolean);
          }),
          Cake.distinct('category', { isAvailable: true })
        ]);
      } catch (filterError) {
        console.error('Error loading filter options:', filterError);
        // Continue without filter options rather than failing the whole request
        availableFlavors = [];
        availableCategories = [];
      }
    }

    res.json({
      success: true,
      data: {
        cakes,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCakes,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        filters: {
          availableFlavors,
          availableCategories
        }
      }
    });
  } catch (error) {
    console.error('Get cakes error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Handle specific error types
    if (error.name === 'MongoTimeoutError' || error.message.includes('timeout')) {
      return res.status(504).json({
        success: false,
        message: 'Request timeout - please try again'
      });
    }
    
    if (error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error - please try again'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters'
      });
    }
    
    // Always log the error for debugging, but only send safe message to client
    res.status(500).json({
      success: false,
      message: 'Error fetching cakes',
      // Include error details in production for debugging (can be removed later)
      ...(process.env.NODE_ENV !== 'development' && { 
        error: error.message,
        code: error.code || error.name
      })
    });
  }
});

// Get single cake by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    
    if (!cake) {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }

    res.json({
      success: true,
      cake
    });
  } catch (error) {
    console.error('Get cake error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching cake details'
    });
  }
});

// Admin routes - require authentication and admin role

// Add new cake (Admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const cakeData = req.body;
    
    // If image was uploaded, add imageUrl to cake data
    if (req.file) {
      cakeData.imageUrl = req.file.path;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Parse weightOptions if it's a string
    if (typeof cakeData.weightOptions === 'string') {
      cakeData.weightOptions = JSON.parse(cakeData.weightOptions);
    }

    // Parse tags if it's a string
    if (cakeData.tags && typeof cakeData.tags === 'string') {
      cakeData.tags = JSON.parse(cakeData.tags);
    }

    // Parse flavors if it's a string
    if (cakeData.flavors && typeof cakeData.flavors === 'string') {
      try {
        cakeData.flavors = JSON.parse(cakeData.flavors);
      } catch (error) {
        console.error('Error parsing flavors JSON:', cakeData.flavors, error);
        // If JSON parsing fails, try to handle comma-separated values
        if (cakeData.flavors.includes(',')) {
          cakeData.flavors = cakeData.flavors.split(',').map(f => f.trim()).filter(f => f);
        } else {
          cakeData.flavors = [cakeData.flavors];
        }
      }
    }

    // Handle flavors - ensure we have a flavors array and set single flavor from first element
    if (cakeData.flavors && Array.isArray(cakeData.flavors)) {
      // Remove empty flavors and trim
      cakeData.flavors = cakeData.flavors.filter(flavor => flavor && flavor.trim());
      // Set the single flavor field to the first flavor for backward compatibility
      if (cakeData.flavors.length > 0) {
        cakeData.flavor = cakeData.flavors[0];
      }
    }

    // Validate the cake data
    const validationErrors = [];
    if (!cakeData.name) validationErrors.push('Name is required');
    if (!cakeData.flavors || cakeData.flavors.length === 0) {
      validationErrors.push('At least one flavor is required');
    }
    if (!cakeData.price) validationErrors.push('Price is required');
    if (!cakeData.description) validationErrors.push('Description is required');
    if (!cakeData.weightOptions || !Array.isArray(cakeData.weightOptions) || cakeData.weightOptions.length === 0) {
      validationErrors.push('At least one weight option is required');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const cake = new Cake(cakeData);
    await cake.save();

    res.status(201).json({
      success: true,
      message: 'Cake added successfully',
      cake
    });
  } catch (error) {
    console.error('Add cake error:', error);
    
    // If there's an error and image was uploaded, delete it
    if (req.file) {
      await deleteImage(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error adding cake',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update cake (Admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const cakeData = req.body;
    const existingCake = await Cake.findById(req.params.id);

    if (!existingCake) {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }

    // If new image was uploaded, add imageUrl to cake data and delete old image
    if (req.file) {
      cakeData.imageUrl = req.file.path;
      // Delete old image if it exists
      if (existingCake.imageUrl) {
        await deleteImage(existingCake.imageUrl);
      }
    } else {
      // If no new image uploaded, preserve the existing imageUrl
      cakeData.imageUrl = existingCake.imageUrl;
    }

    // Parse weightOptions if it's a string
    if (typeof cakeData.weightOptions === 'string') {
      cakeData.weightOptions = JSON.parse(cakeData.weightOptions);
    }

    // Parse tags if it's a string
    if (cakeData.tags && typeof cakeData.tags === 'string') {
      cakeData.tags = JSON.parse(cakeData.tags);
    }

    // Parse flavors if it's a string
    if (cakeData.flavors && typeof cakeData.flavors === 'string') {
      try {
        cakeData.flavors = JSON.parse(cakeData.flavors);
      } catch (error) {
        console.error('Error parsing flavors JSON:', cakeData.flavors, error);
        // If JSON parsing fails, try to handle comma-separated values
        if (cakeData.flavors.includes(',')) {
          cakeData.flavors = cakeData.flavors.split(',').map(f => f.trim()).filter(f => f);
        } else {
          cakeData.flavors = [cakeData.flavors];
        }
      }
    }

    // Handle flavors - ensure we have a flavors array and set single flavor from first element
    if (cakeData.flavors && Array.isArray(cakeData.flavors)) {
      // Remove empty flavors and trim
      cakeData.flavors = cakeData.flavors.filter(flavor => flavor && flavor.trim());
      if (cakeData.flavors.length === 0) {
        delete cakeData.flavors;
      } else {
        // Set the single flavor field to the first flavor for backward compatibility
        cakeData.flavor = cakeData.flavors[0];
      }
    }

    // Ensure we have flavors for validation
    if (!cakeData.flavors || cakeData.flavors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one flavor is required'
      });
    }


    const cake = await Cake.findByIdAndUpdate(
      req.params.id,
      cakeData,
      { new: true, runValidators: true }
    );

    if (!cake) {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }

    res.json({
      success: true,
      message: 'Cake updated successfully',
      cake
    });
  } catch (error) {
    console.error('Update cake error:', error);
    
    // If there's an error and new image was uploaded, delete it
    if (req.file) {
      await deleteImage(req.file.path);
    }
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating cake',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete cake (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cake = await Cake.findByIdAndDelete(req.params.id);

    if (!cake) {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }

    res.json({
      success: true,
      message: 'Cake deleted successfully'
    });
  } catch (error) {
    console.error('Delete cake error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting cake'
    });
  }
});

// Get all cakes for admin (including unavailable)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isAvailable,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    if (category) {
      filter.category = category;
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cakes = await Cake.find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCakes = await Cake.countDocuments(filter);
    const totalPages = Math.ceil(totalCakes / parseInt(limit));

    res.json({
      success: true,
      data: {
        cakes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCakes,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Admin get cakes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cakes for admin'
    });
  }
});

// Toggle cake availability (Admin only)
router.patch('/:id/availability', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const cake = await Cake.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    );

    if (!cake) {
      return res.status(404).json({
        success: false,
        message: 'Cake not found'
      });
    }

    res.json({
      success: true,
      message: `Cake ${isAvailable ? 'activated' : 'deactivated'} successfully`,
      cake
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling cake availability'
    });
  }
});

module.exports = router;
