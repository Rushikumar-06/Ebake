const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    cakeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cake',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
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
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    area: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      default: 'Hyderabad',
      enum: ['Hyderabad']
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode']
    },
    landmark: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['Order Placed', 'Completed', 'Cancelled'],
    default: 'Order Placed'
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted address
orderSchema.virtual('formattedAddress').get(function() {
  const { street, area, city, pincode, landmark } = this.deliveryAddress;
  let address = `${street}, ${area}, ${city} - ${pincode}`;
  if (landmark) address += `, Near ${landmark}`;
  return address;
});

orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
