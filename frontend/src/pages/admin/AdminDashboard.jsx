import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users
} from 'lucide-react';
import { adminAPI } from '../../lib/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  const { overview, recentOrders, charts } = dashboardData || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{overview.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{overview.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Cakes</p>
                <p className="text-2xl font-bold text-gray-900">{overview.availableCakes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="p-6">
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-sm text-gray-500">
                        {order.userId?.name || order.customerInfo?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{order.totalAmount}</p>
                      <p className={`text-sm ${
                        order.status === 'Completed' ? 'text-green-600' :
                        order.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent orders</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
          </div>
          <div className="p-6">
            {overview && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ₹{overview.totalRevenue?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Cakes</span>
                  <span className="text-xl font-semibold text-gray-900">{overview.totalCakes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cancelled Orders</span>
                  <span className="text-xl font-semibold text-red-600">{overview.cancelledOrders || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
