import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleAuth, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);

  const from = location.state?.from || '/';
  const message = location.state?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleGoogleCallback = useCallback(async (response) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const googleData = {
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        imageUrl: payload.picture,
      };

      const result = await googleAuth(googleData);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Google authentication error:', error);
    }
  }, [googleAuth, navigate, from]);

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initializeGoogleAuth = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
          }
        );
      }
    };

    // Check if Google is already loaded
    if (window.google) {
      initializeGoogleAuth();
    } else {
      // Wait for Google to load
      const checkGoogle = () => {
        if (window.google) {
          initializeGoogleAuth();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    }
  }, []); // Remove handleGoogleCallback dependency to prevent re-initialization

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleLogin = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      console.error('Google Identity Services not loaded');
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center text-3xl">
            🎂
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back to Ebake
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account to continue
          </p>
          {message && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">{message}</p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="loading-spinner w-5 h-5"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Google Sign In */}
          <div>
            <div ref={googleButtonRef}></div>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-md">
                Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
