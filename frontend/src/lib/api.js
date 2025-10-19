import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Important for cookies
  timeout: 10000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed, but we're using cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Let individual components handle 401 errors
    // This prevents infinite reloads from the interceptor
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (userData) => axiosInstance.post('/auth/register', userData),
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  googleAuth: (googleData) => axiosInstance.post('/auth/google', googleData),
  logout: () => axiosInstance.post('/auth/logout'),
  getProfile: () => axiosInstance.get('/auth/me'),
  updateProfile: (userData) => axiosInstance.put('/auth/profile', userData),
  changePassword: (passwordData) => axiosInstance.put('/auth/change-password', passwordData),
};

export const cakeAPI = {
  getAllCakes: (params) => axiosInstance.get('/cakes', { params }),
  getCakeById: (id) => axiosInstance.get(`/cakes/${id}`),
  // Admin endpoints
  createCake: (cakeData) => {
    const formData = new FormData();
    
    // Add all cake data to formData
    Object.keys(cakeData).forEach(key => {
      if (key === 'image' && cakeData[key]) {
        formData.append(key, cakeData[key]);
      } else if (key === 'weightOptions' || key === 'tags') {
        formData.append(key, JSON.stringify(cakeData[key]));
      } else if (key === 'flavors') {
        // Ensure flavors is properly handled - should be an array
        if (Array.isArray(cakeData[key])) {
          formData.append(key, JSON.stringify(cakeData[key]));
        } else if (cakeData[key]) {
          // If it's not an array, skip it
          console.warn('Flavors is not an array:', cakeData[key]);
        }
      } else {
        formData.append(key, cakeData[key]);
      }
    });

    return axiosInstance.post('/cakes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateCake: (id, cakeData) => {
    const formData = new FormData();
    
    // Add all cake data to formData
    Object.keys(cakeData).forEach(key => {
      if (key === 'image') {
        // For image field, ONLY include if it's a valid File object
        // This ensures no null/undefined image values are ever sent
        if (cakeData[key] instanceof File && cakeData[key] !== null) {
          formData.append(key, cakeData[key]);
        }
        // Skip completely if not a File object (preserves existing image on backend)
      } else if (key === 'weightOptions' || key === 'tags') {
        formData.append(key, JSON.stringify(cakeData[key]));
      } else if (key === 'flavors') {
        // Ensure flavors is properly handled - should be an array
        if (Array.isArray(cakeData[key])) {
          formData.append(key, JSON.stringify(cakeData[key]));
        } else if (cakeData[key]) {
          // If it's not an array, skip it
          console.warn('Flavors is not an array:', cakeData[key]);
        }
      } else {
        // Skip null/undefined values for other fields too
        if (cakeData[key] !== null && cakeData[key] !== undefined) {
          formData.append(key, cakeData[key]);
        }
      }
    });

    return axiosInstance.put(`/cakes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteCake: (id) => axiosInstance.delete(`/cakes/${id}`),
  getAllCakesAdmin: (params) => axiosInstance.get('/cakes/admin/all', { params }),
  toggleAvailability: (id, isAvailable) => 
    axiosInstance.patch(`/cakes/${id}/availability`, { isAvailable }),
};

export const orderAPI = {
  createOrder: (orderData) => axiosInstance.post('/orders', orderData),
  getUserOrders: (params) => axiosInstance.get('/orders/my-orders', { params }),
  getOrderById: (id) => axiosInstance.get(`/orders/${id}`),
  // Admin endpoints
  getAllOrders: (params) => axiosInstance.get('/orders/admin/all', { params }),
  updateOrderStatus: (id, status, cancellationReason) => 
    axiosInstance.patch(`/orders/${id}/status`, { status, cancellationReason }),
};

export const adminAPI = {
  getDashboard: () => axiosInstance.get('/admin/dashboard'),
  getProfile: () => axiosInstance.get('/admin/profile'),
  updateProfile: (userData) => axiosInstance.put('/admin/profile', userData),
};

export default axiosInstance;
