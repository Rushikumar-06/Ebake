import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Phone, Mail, Package, ArrowLeft, User } from 'lucide-react';
import { orderAPI } from '../../lib/api';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getOrderById(id);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">The order you're looking for doesn't exist.</p>
          <Link to="/orders" className="btn-primary">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/orders" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Orders
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600 mt-2 flex items-center">
              <Calendar size={16} className="mr-2" />
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="mr-2" />
              Order Items
            </h2>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.cakeId.imageUrl}
                      alt={item.cakeId.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.cakeId.name}</h3>
                    <p className="text-sm text-gray-600">{item.cakeId.flavor}</p>
                    <p className="text-sm text-gray-500">Weight: {item.weight} • Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">₹{item.price * item.quantity}</p>
                    <p className="text-sm text-gray-500">₹{item.price} each</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="mr-2" />
              Delivery Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                <div className="text-gray-600">
                  <p className="font-medium">{order.deliveryAddress.street}</p>
                  <p>{order.deliveryAddress.area}</p>
                  <p>{order.deliveryAddress.city} - {order.deliveryAddress.pincode}</p>
                  {order.deliveryAddress.landmark && (
                    <p className="text-sm text-gray-500">Near {order.deliveryAddress.landmark}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Estimated Delivery</h3>
                <p className="text-gray-600 flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {formatDate(order.estimatedDelivery)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="mr-2" />
              Customer Details
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <User size={16} className="mr-3 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{order.customerInfo.name}</p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Mail size={16} className="mr-3 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{order.customerInfo.email}</p>
                  <p className="text-sm text-gray-500">Email</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone size={16} className="mr-3 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{order.customerInfo.phone}</p>
                  <p className="text-sm text-gray-500">Phone</p>
                </div>
              </div>
            </div>

            {/* Cancellation Reason */}
            {order.status === 'Cancelled' && order.cancellationReason && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Cancellation Reason:</h4>
                <p className="text-sm text-red-700">{order.cancellationReason}</p>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Order Notes:</h4>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
