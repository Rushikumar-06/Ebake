import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Package, MapPin, Eye } from 'lucide-react';
import { orderAPI } from '../../lib/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getUserOrders();
      setOrders(response.data.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100'; // Keep for backward compatibility
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
          <p className="text-gray-600 mb-8">Start ordering delicious cakes to see them here.</p>
          <Link to="/" className="btn-primary">
            Browse Cakes
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar size={16} className="mr-1" />
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Order Items */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-3">Items Ordered</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.cakeId.imageUrl}
                              alt={item.cakeId.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.cakeId.name}</p>
                            <p className="text-xs text-gray-500">{item.cakeId.flavor} • {item.weight}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-sm">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div>
                    <div className="space-y-4">
                      {/* Delivery Address */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <MapPin size={16} className="mr-1" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.formattedAddress || `${order.deliveryAddress.street}, ${order.deliveryAddress.area}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`}
                        </p>
                      </div>

                      {/* Order Summary */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-semibold">₹{order.totalAmount}</span>
                        </div>
                        {order.estimatedDelivery && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Est. Delivery:</span>
                            <span className="text-gray-900">{formatDate(order.estimatedDelivery)}</span>
                          </div>
                        )}
                      </div>

                      {/* Cancellation Reason */}
                      {order.status === 'Cancelled' && order.cancellationReason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h5 className="font-medium text-red-900 text-sm mb-1">Cancellation Reason:</h5>
                          <p className="text-sm text-red-700">{order.cancellationReason}</p>
                        </div>
                      )}

                      {/* View Order Button */}
                      <Link
                        to={`/orders/${order._id}`}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm"
                      >
                        <Eye size={16} />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
