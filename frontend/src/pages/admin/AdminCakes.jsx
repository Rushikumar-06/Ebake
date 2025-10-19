import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Edit, Trash2, Eye, EyeOff, X, Upload, Save, Search, Filter } from 'lucide-react';
import { cakeAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const weightOptions = ['500g', '1kg', '1.5kg', '2kg', '2.5kg', '3kg'];
const categories = ['Birthday', 'Wedding', 'Anniversary', 'Corporate', 'Festival', 'Other'];

const cakeSchema = yup.object({
  name: yup.string().required('Cake name is required').max(100, 'Name cannot exceed 100 characters'),
  flavors: yup.array()
    .of(yup.string().max(50, 'Flavor cannot exceed 50 characters'))
    .min(1, 'At least one flavor is required'),
  price: yup.number().required('Price is required').min(0, 'Price cannot be negative'),
  description: yup.string().required('Description is required').max(500, 'Description cannot exceed 500 characters'),
  category: yup.string().oneOf(categories).required('Category is required'),
  weightOptions: yup.array().of(
    yup.object({
      weight: yup.string().oneOf(weightOptions).required('Weight is required'),
      price: yup.number().required('Price is required').min(0, 'Price cannot be negative'),
    })
  ).min(1, 'At least one weight option is required'),
  tags: yup.array().of(yup.string()),
  isAvailable: yup.boolean(),
  image: yup.mixed(),
});

const AdminCakes = () => {
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isAvailable: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(cakeSchema),
    defaultValues: {
      name: '',
      flavors: [''],
      price: '',
      description: '',
      category: 'Other',
      weightOptions: [{ weight: '500g', price: '' }],
      tags: [],
      isAvailable: true,
      image: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'weightOptions',
  });

  const { 
    fields: flavorFields, 
    append: appendFlavor, 
    remove: removeFlavor 
  } = useFieldArray({
    control,
    name: 'flavors',
  });

  const watchedImage = watch('image');

  useEffect(() => {
    fetchCakes();
  }, []);

  // Handle image preview
  useEffect(() => {
    if (watchedImage instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(watchedImage);
    } else if (editingCake?.imageUrl) {
      setImagePreview(editingCake.imageUrl);
    }
  }, [watchedImage, editingCake]);

  // Reset form and image preview
  const resetForm = () => {
    reset({
      name: '',
      flavors: [''],
      price: '',
      description: '',
      category: 'Other',
      weightOptions: [{ weight: '500g', price: '' }],
      tags: [],
      isAvailable: true,
      // Don't include image field in reset for new forms
    });
    setImagePreview(null);
    setEditingCake(null);
    
    // Clear the file input manually
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setValue('image', undefined);
  };

  const handleEditCake = (cake) => {
    setEditingCake(cake);
    setImagePreview(cake.imageUrl);
    
    // Convert single flavor to array if needed, or use existing flavors array
    let flavorsArray = [];
    if (cake.flavors && Array.isArray(cake.flavors) && cake.flavors.length > 0) {
      flavorsArray = cake.flavors.filter(flavor => flavor && flavor.trim());
    } else if (cake.flavor && cake.flavor.trim()) {
      flavorsArray = [cake.flavor];
    }
    
    // Ensure we have at least one empty field if no flavors exist
    if (flavorsArray.length === 0) {
      flavorsArray = [''];
    }
    
    reset({
      name: cake.name,
      flavors: flavorsArray,
      price: cake.price,
      description: cake.description,
      category: cake.category,
      weightOptions: cake.weightOptions,
      tags: cake.tags || [],
      isAvailable: cake.isAvailable,
      // Don't include image field when editing - manage it separately
    });
    
    // Clear the file input and reset form image field
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setValue('image', undefined); // Clear the form field
    
    setShowAddForm(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Start with clean form data, excluding image initially
      const { image, ...otherData } = data;
      const formData = { ...otherData };
      
      // Check for new image file - only from file input since form data might have null
      const imageFile = (fileInputRef.current?.files && fileInputRef.current.files[0]) || 
                       (data.image instanceof File ? data.image : null);
      
      if (!editingCake) {
        // For NEW cakes - image is required
        if (!imageFile || !(imageFile instanceof File)) {
          toast.error('Image is required for new cakes');
          setIsSubmitting(false);
          return;
        }
        formData.image = imageFile;
      } else {
        // For EDITING existing cakes
        if (imageFile && imageFile instanceof File) {
          // New image file selected - include it for update
          formData.image = imageFile;
        }
        // If no new image file, don't include image field at all - backend will preserve existing
      }

      // Convert price to number
      formData.price = parseFloat(formData.price);

      // Convert weight option prices to numbers
      if (formData.weightOptions && Array.isArray(formData.weightOptions)) {
        formData.weightOptions = formData.weightOptions.map(option => ({
          ...option,
          price: parseFloat(option.price)
        }));
      }

      // Process flavors - filter out empty flavors and ensure we have at least one
      if (formData.flavors && Array.isArray(formData.flavors)) {
        formData.flavors = formData.flavors.filter(flavor => flavor && flavor.trim());
        // Ensure we have at least one flavor
        if (formData.flavors.length === 0) {
          toast.error('At least one flavor is required');
          setIsSubmitting(false);
          return;
        }
      } else {
        toast.error('At least one flavor is required');
        setIsSubmitting(false);
        return;
      }

      // Final check - ensure no image field exists if we don't want to update image
      if (editingCake && !formData.image) {
        delete formData.image;
      }

      if (editingCake) {
        await cakeAPI.updateCake(editingCake._id, formData);
        toast.success('Cake updated successfully!');
      } else {
        await cakeAPI.createCake(formData);
        toast.success('Cake added successfully!');
      }

      setShowAddForm(false);
      resetForm();
      fetchCakes();
    } catch (error) {
      console.error('Error saving cake:', error);
      console.error('Error details:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Error saving cake';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCake = async (cakeId) => {
    if (window.confirm('Are you sure you want to delete this cake?')) {
      try {
        await cakeAPI.deleteCake(cakeId);
        toast.success('Cake deleted successfully!');
        fetchCakes();
      } catch (error) {
        console.error('Error deleting cake:', error);
        toast.error('Error deleting cake');
      }
    }
  };

  const fetchCakes = async (params = {}) => {
    try {
      setLoading(true);
      // Build query parameters
      const queryParams = {
        ...params,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.isAvailable && { isAvailable: filters.isAvailable }),
        ...(filters.category && { category: filters.category }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await cakeAPI.getAllCakesAdmin(queryParams);
      setCakes(response.data.data.cakes);
    } catch (error) {
      console.error('Error fetching cakes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search and filter handlers
  const handleSearch = () => {
    fetchCakes();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    fetchCakes();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      isAvailable: '',
      category: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    fetchCakes();
  };

  const toggleAvailability = async (cakeId, currentStatus) => {
    try {
      await cakeAPI.toggleAvailability(cakeId, !currentStatus);
      fetchCakes(); // Refresh the list
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Cake Management</h1>
          <p className="text-gray-600 mt-2">Manage your cake inventory</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Cake
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cakes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              Filters
            </button>
            
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
            
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  value={filters.isAvailable}
                  onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="createdAt">Date Added</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="category">Category</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cakes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cakes.map((cake) => (
          <div key={cake._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img
                src={cake.imageUrl}
                alt={cake.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{cake.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  cake.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {cake.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">
                {cake.flavors && cake.flavors.length > 0 
                  ? cake.flavors.join(', ') 
                  : cake.flavor || 'No flavor specified'}
              </p>
              <p className="text-gray-500 text-xs mb-3 line-clamp-2">{cake.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary-600">₹{cake.price}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAvailability(cake._id, cake.isAvailable)}
                    className={`p-2 rounded ${
                      cake.isAvailable 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {cake.isAvailable ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={() => handleEditCake(cake)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCake(cake._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cakes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎂</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No cakes found</h3>
          <p className="text-gray-600 mb-4">Start by adding your first cake to the inventory.</p>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="btn-primary"
          >
            Add First Cake
          </button>
        </div>
      )}

      {/* Add/Edit Cake Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCake ? 'Edit Cake' : 'Add New Cake'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cake Image {!editingCake && '*'}
                      </label>
                      {editingCake && (
                        <p className="text-sm text-gray-500 mb-2">
                          Leave empty to keep current image
                        </p>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                            </div>
                            <input
                              ref={fileInputRef}
                              name="image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setValue('image', file);
                                } else {
                                  // Clear the form field if no file selected
                                  setValue('image', undefined);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {errors.image && (
                          <p className="text-red-600 text-sm">{errors.image.message}</p>
                        )}
                        {imagePreview && (
                          <div className="mt-4">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cake Name *
                      </label>
                      <input
                        {...register('name')}
                        type="text"
                        className="input-field"
                        placeholder="Enter cake name"
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Flavors *
                        </label>
                        <button
                          type="button"
                          onClick={() => appendFlavor('')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Plus size={16} />
                          Add Flavor
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {flavorFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <input
                              {...register(`flavors.${index}`)}
                              type="text"
                              className="input-field flex-1"
                              placeholder={`Flavor ${index + 1}`}
                            />
                            {flavorFields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFlavor(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {errors.flavors && (
                        <p className="text-red-600 text-sm mt-1">{errors.flavors.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select {...register('category')} className="input-field">
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Pricing and Details */}
                  <div className="space-y-4">
                    {/* Base Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Price (for smallest size) *
                      </label>
                      <input
                        {...register('price', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field"
                        placeholder="0.00"
                      />
                      {errors.price && (
                        <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                      )}
                    </div>

                    {/* Weight Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight Options *
                      </label>
                      <div className="space-y-3">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex gap-3">
                            <select
                              {...register(`weightOptions.${index}.weight`)}
                              className="input-field flex-1"
                            >
                              {weightOptions.map((weight) => (
                                <option key={weight} value={weight}>
                                  {weight}
                                </option>
                              ))}
                            </select>
                            <input
                              {...register(`weightOptions.${index}.price`, { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              min="0"
                              className="input-field flex-1"
                              placeholder="Price"
                            />
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => append({ weight: '500g', price: '' })}
                          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <Plus size={16} />
                          Add Weight Option
                        </button>
                      </div>
                      {errors.weightOptions && (
                        <p className="text-red-600 text-sm mt-1">{errors.weightOptions.message}</p>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="flex items-center">
                      <input
                        {...register('isAvailable')}
                        type="checkbox"
                        id="isAvailable"
                        className="mr-2"
                      />
                      <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                        Available for ordering
                      </label>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Describe the cake, ingredients, special features, etc."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save size={20} />
                    {isSubmitting ? 'Saving...' : editingCake ? 'Update Cake' : 'Add Cake'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCakes;
