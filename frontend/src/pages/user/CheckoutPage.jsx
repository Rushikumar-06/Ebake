import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CreditCard, MapPin, Phone, User, Mail, Calendar, MessageSquare } from 'lucide-react';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import { orderAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number').required('Phone is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  street: yup.string().required('Street address is required'),
  area: yup.string().required('Area is required'),
  city: yup.string().oneOf(['Hyderabad'], 'We only deliver in Hyderabad').required('City is required'),
  pincode: yup.string().matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode').required('Pincode is required'),
  landmark: yup.string(),
  estimatedDelivery: yup.date()
    .min(new Date(new Date().setDate(new Date().getDate() + 1)), 'Delivery date must be at least 1 day from today')
    .required('Delivery date is required'),
  notes: yup.string().max(200, 'Notes cannot exceed 200 characters'),
});

const CheckoutPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, totalAmount, clearCart, removeUnavailableItems } = useCartStore();
  const { user, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin - admins cannot access checkout
    if (isAdmin()) {
      toast.error('Admins cannot place orders. Please use a customer account.');
      navigate('/admin');
      return;
    }

    // Clean up unavailable items when checkout page loads
    removeUnavailableItems();
  }, [isAdmin, navigate, removeUnavailableItems]);

  // Set default delivery date to tomorrow
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      city: 'Hyderabad',
      landmark: '',
      estimatedDelivery: getMinDate(),
      notes: '',
    },
  });

  const onSubmit = async (data) => {
    setIsProcessing(true);
    try {
      const orderData = {
        items: items.map(item => ({
          cakeId: item.cakeId,
          quantity: item.quantity,
          weight: item.weight,
          price: item.price,
        })),
        customerInfo: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
        deliveryAddress: {
          street: data.street,
          area: data.area,
          city: data.city,
          pincode: data.pincode,
          landmark: data.landmark,
        },
        estimatedDelivery: data.estimatedDelivery,
        notes: data.notes || '',
      };

      const response = await orderAPI.createOrder(orderData);
      
      clearCart();
      navigate(`/orders/${response.data.order._id}`, {
        state: { orderSuccess: true }
      });
    } catch (error) {
      console.error('Order creation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No items in cart</h1>
          <p className="text-gray-600 mb-8">Add some cakes to your cart before checkout.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <User className="mr-2" />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    {...register('name')}
                    type="text"
                    className="input-field"
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="input-field"
                  />
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="input-field"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <MapPin className="mr-2" />
                Delivery Address
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                  <input
                    {...register('street')}
                    type="text"
                    className="input-field"
                    placeholder="House number, street name"
                  />
                  {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Area/Locality *</label>
                    <input
                      {...register('area')}
                      type="text"
                      className="input-field"
                      placeholder="Area or locality name"
                    />
                    {errors.area && <p className="text-red-600 text-sm mt-1">{errors.area.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <select {...register('city')} className="input-field">
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                    <input
                      {...register('pincode')}
                      type="text"
                      className="input-field"
                      placeholder="6-digit pincode"
                    />
                    {errors.pincode && <p className="text-red-600 text-sm mt-1">{errors.pincode.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                    <input
                      {...register('landmark')}
                      type="text"
                      className="input-field"
                      placeholder="Nearby landmark"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Calendar className="mr-2" />
                Delivery Date
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When would you like your order delivered? *
                </label>
                <input
                  {...register('estimatedDelivery')}
                  type="date"
                  min={getMinDate()}
                  className="input-field"
                />
                {errors.estimatedDelivery && (
                  <p className="text-red-600 text-sm mt-1">{errors.estimatedDelivery.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Please select a date at least 1 day from today. We'll do our best to deliver on your preferred date.
                </p>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <MessageSquare className="mr-2" />
                Special Instructions
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any special instructions for your order? (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="e.g., Please add a birthday message, deliver at a specific time, special packaging instructions, etc."
                />
                {errors.notes && (
                  <p className="text-red-600 text-sm mt-1">{errors.notes.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Let us know any special requirements or instructions for your order.
                </p>
              </div>
            </div>

            {/* Place Order */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.cakeId}-${item.weight}`} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.weight} x {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
