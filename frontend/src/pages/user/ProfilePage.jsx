import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User, Mail, Phone, MapPin, Lock, Save } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

const profileSchema = yup.object({
  name: yup.string().required('Name is required'),
  phone: yup.string().matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
  address: yup.string().max(200, 'Address cannot exceed 200 characters'),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Please confirm your password'),
});

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, updateProfile, changePassword } = useAuthStore();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const onProfileUpdate = async (data) => {
    setIsUpdating(true);
    const result = await updateProfile(data);
    if (result.success) {
      resetProfile(data);
    }
    setIsUpdating(false);
  };

  const onPasswordChange = async (data) => {
    setIsUpdating(true);
    const result = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    if (result.success) {
      resetPassword();
    }
    setIsUpdating(false);
  };

  // Redirect Google users away from password tab
  useEffect(() => {
    if (user?.googleId && activeTab === 'password') {
      setActiveTab('profile');
    }
  }, [user?.googleId, activeTab]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Personal Information
            </button>
            {!user?.googleId && (
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'password'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Change Password
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="mr-2" />
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerProfile('name')}
                        type="text"
                        className="input-field pl-10"
                      />
                    </div>
                    {profileErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="input-field pl-10 bg-gray-50 text-gray-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerProfile('phone')}
                        type="tel"
                        className="input-field pl-10"
                      />
                    </div>
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={user?.role === 'admin' ? 'Administrator' : 'Customer'}
                        disabled
                        className="input-field bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        {...registerProfile('address')}
                        rows={3}
                        className="input-field pl-10 resize-none"
                        placeholder="Enter your address"
                      />
                    </div>
                    {profileErrors.address && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.address.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save size={20} />
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && !user?.googleId && (
            <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Lock className="mr-2" />
                  Change Password
                </h2>

                <div className="max-w-md space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerPassword('currentPassword')}
                        type="password"
                        className="input-field pl-10"
                      />
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerPassword('newPassword')}
                        type="password"
                        className="input-field pl-10"
                      />
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...registerPassword('confirmPassword')}
                        type="password"
                        className="input-field pl-10"
                      />
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Lock size={20} />
                    {isUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
