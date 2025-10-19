const mongoose = require('mongoose');

const cakeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cake name is required'],
    trim: true,
    maxlength: [100, 'Cake name cannot exceed 100 characters']
  },
  flavor: {
    type: String,
    required: function() {
      return !this.flavors || this.flavors.length === 0;
    },
    trim: true,
    maxlength: [50, 'Flavor cannot exceed 50 characters']
  },
  flavors: [{
    type: String,
    trim: true,
    maxlength: [50, 'Flavor cannot exceed 50 characters']
  }],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  weightOptions: [{
    weight: {
      type: String,
      required: true,
      enum: ['500g', '1kg', '1.5kg', '2kg', '2.5kg', '3kg']
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  category: {
    type: String,
    enum: ['Birthday', 'Wedding', 'Anniversary', 'Corporate', 'Festival', 'Other'],
    default: 'Other'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for search functionality
cakeSchema.index({ name: 'text', flavor: 'text', description: 'text' });

// Virtual for average rating calculation
cakeSchema.virtual('averageRating').get(function() {
  return this.reviewCount > 0 ? (this.rating / this.reviewCount).toFixed(1) : 0;
});

// Ensure virtual fields are included when converting to JSON
cakeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cake', cakeSchema);
