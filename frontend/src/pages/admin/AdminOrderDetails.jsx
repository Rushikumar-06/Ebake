import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X, 
  MessageSquare,
  Phone,
  Mail,
  Package
} from 'lucide-react';
import { orderAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderAPI.getOrderById(id);
      
      if (response.data.success && response.data.order) {
        setOrder(response.data.order);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error loading order details');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus, reason = '') => {
    try {
      await orderAPI.updateOrderStatus(id, newStatus, reason);
      toast.success(`Order ${newStatus.toLowerCase()} successfully`);
      fetchOrderDetails(); // Refresh order details
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Error updating order status');
    }
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const confirmCancelOrder = () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    updateOrderStatus('Cancelled', cancellationReason);
    setShowCancelModal(false);
    setCancellationReason('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return 'text-yellow-600 bg-yellow-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDisplayStatus = (status) => {
    return status === 'Order Placed' ? 'Pending' : status;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h3>
        <Link to="/admin/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/orders"
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Orders
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {getDisplayStatus(order.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="mr-2" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <img
                    src={item.cakeId?.imageUrl}
                    alt={item.cakeId?.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.cakeId?.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.cakeId?.flavor} • {item.weight}
                    </p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{item.price}</p>
                    <p className="text-sm text-gray-500">
                      ₹{item.price * item.quantity} total
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-primary-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Customer Messages */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="mr-2" />
                Customer Instructions
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-900 font-medium">{order.customerInfo.name}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{order.customerInfo.phone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{order.customerInfo.email}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="mr-2" />
              Delivery Information
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Delivery Address:</h3>
                <p className="text-gray-700 mt-1">
                  {order.deliveryAddress.street},<br />
                  {order.deliveryAddress.area},<br />
                  {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                  {order.deliveryAddress.landmark && (
                    <>
                      <br />
                      Near {order.deliveryAddress.landmark}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Estimated Delivery:</p>
                  <p className="font-medium text-gray-900">{formatDate(order.estimatedDelivery)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Actions */}
          {(order.status === 'Pending' || order.status === 'Order Placed') && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => updateOrderStatus('Completed')}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={20} />
                  Mark as Completed
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={20} />
                  Cancel Order
                </button>
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          {order.status === 'Cancelled' && order.cancellationReason && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancellation Reason</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700">{order.cancellationReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Order #{order._id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for cancelling this order. This will be shared with the customer.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason *
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Enter reason for cancellation..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cancellationReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCancelOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetails;
