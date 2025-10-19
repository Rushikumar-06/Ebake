import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';

// User Components
import Layout from './components/Layout';
import HomePage from './pages/user/HomePage';
import CakeDetailsPage from './pages/user/CakeDetailsPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';
import OrderDetailsPage from './pages/user/OrderDetailsPage';
import ProfilePage from './pages/user/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCakes from './pages/admin/AdminCakes';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetails from './pages/admin/AdminOrderDetails';
import AdminProfile from './pages/admin/AdminProfile';

// Protected Routes
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  const { getProfile, isAuthenticated, isLoading, profileChecked } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load only once
    if (!profileChecked && !isLoading) {
      getProfile();
    }
  }, []); // Empty dependency array - only run once on mount

  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* User Routes */}
            <Route path="/" element={<Layout />}>
              {/* Public routes - no login required */}
              <Route index element={<HomePage />} />
              <Route path="cake/:id" element={<CakeDetailsPage />} />
              
              {/* Protected routes - login required */}
              <Route 
                path="cart" 
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="checkout" 
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="orders" 
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="orders/:id" 
                element={
                  <ProtectedRoute>
                    <OrderDetailsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="cakes" element={<AdminCakes />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetails />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Page not found</p>
                  <a href="/" className="btn-primary">Go Home</a>
                </div>
              </div>
            } />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            key="toaster"
            position="top-left"
            toastOptions={{
              duration: 1000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
