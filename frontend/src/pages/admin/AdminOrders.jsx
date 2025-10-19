import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, X, Calendar, User } from 'lucide-react';
import { orderAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await orderAPI.getAllOrders(params);
      
      if (response.data.success && response.data.data) {
        setOrders(response.data.data.orders || []);
      } else {
        console.error('Invalid response format:', response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, reason = '') => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus, reason);
      fetchOrders(); // Refresh the list
      toast.success(`Order ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Error updating order status');
    }
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
    setCancellationReason('');
  };

  const confirmCancelOrder = () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    updateOrderStatus(selectedOrder._id, 'Cancelled', cancellationReason);
    setShowCancelModal(false);
    setSelectedOrder(null);
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

  // Helper function to get display status (show "Pending" for "Order Placed")
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

  const handleRowClick = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleActionClick = (e) => {
    e.stopPropagation(); // Prevent row click when action buttons are clicked
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-2">Manage customer orders</p>
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Orders</option>
            <option value="Order Placed">Order Placed</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">No orders match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr 
                    key={order._id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    onClick={() => handleRowClick(order._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerInfo?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerInfo?.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{order.totalAmount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getDisplayStatus(order.status)}
                      </span>
                      {order.notes && (
                        <div className="mt-1 text-xs text-gray-500 max-w-xs truncate" title={order.notes}>
                          💬 {order.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2" onClick={handleActionClick}>
                        {(order.status === 'Pending' || order.status === 'Order Placed') && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order._id, 'Completed')}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <CheckCircle size={16} />
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Order #{selectedOrder._id.slice(-8).toUpperCase()}
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
                    setSelectedOrder(null);
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

export default AdminOrders;
