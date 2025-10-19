const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Cake validation
const validateCake = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Cake name must be between 2 and 100 characters'),
  body('flavor')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Flavor must be between 2 and 50 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('weightOptions')
    .isArray({ min: 1 })
    .withMessage('At least one weight option is required'),
  handleValidationErrors
];

// Address validation (Hyderabad only)
const validateAddress = [
  body('street')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
  body('area')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Area must be between 2 and 50 characters'),
  body('city')
    .equals('Hyderabad')
    .withMessage('We only deliver in Hyderabad'),
  body('pincode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please enter a valid 6-digit pincode'),
  handleValidationErrors
];

// Order validation
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.cakeId')
    .isMongoId()
    .withMessage('Invalid cake ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.weight')
    .isIn(['500g', '1kg', '1.5kg', '2kg', '2.5kg', '3kg'])
    .withMessage('Invalid weight option'),
  body('customerInfo.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Customer name must be between 2 and 50 characters'),
  body('customerInfo.phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('customerInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCake,
  validateAddress,
  validateOrder
};
