import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      profileChecked: false,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(credentials);
          const { user } = response.data;
          
          set({ 
            user, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          toast.success('Login successful!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      googleAuth: async (googleData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.googleAuth(googleData);
          const { user } = response.data;
          
          set({ 
            user, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          toast.success('Google authentication successful!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Google authentication failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.register(userData);
          const { user } = response.data;
          
          set({ 
            user, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          toast.success('Registration successful!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
        
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false,
          profileChecked: false
        });
        
        toast.success('Logged out successfully!');
      },

      getProfile: async () => {
        const { profileChecked, isLoading } = get();
        
        // Prevent multiple simultaneous calls
        if (profileChecked || isLoading) {
          return { success: false, error: 'Profile check already in progress' };
        }
        
        set({ isLoading: true });
        try {
          const response = await authAPI.getProfile();
          const { user } = response.data;
          
          set({ 
            user, 
            isAuthenticated: true,
            isLoading: false,
            profileChecked: true
          });
          
          return { success: true };
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false,
            profileChecked: true
          });
          return { success: false, error: error.response?.data?.message };
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.updateProfile(userData);
          const { user } = response.data;
          
          set({ 
            user, 
            isLoading: false 
          });
          
          toast.success('Profile updated successfully!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Profile update failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true });
        try {
          await authAPI.changePassword(passwordData);
          set({ isLoading: false });
          
          toast.success('Password changed successfully!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'Password change failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Helper to check if user is admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
