import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Star, ShoppingCart, Plus, Minus } from 'lucide-react';
import { cakeAPI } from '../../lib/api';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import CartProtectedAction from '../../components/CartProtectedAction';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    flavor: searchParams.get('flavor') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    category: searchParams.get('category') || '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [tempFilters, setTempFilters] = useState({
    search: searchParams.get('search') || '',
    flavor: searchParams.get('flavor') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    category: searchParams.get('category') || '',
  });
  const [pagination, setPagination] = useState({});
  const [availableFilters, setAvailableFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState({});

  const { addToCart, isInCart, getCartItem, updateQuantity, removeUnavailableItems } = useCartStore();
  const { isAdmin } = useAuthStore();

  const fetchCakes = async (params = filters) => {
    setLoading(true);
    try {
      const response = await cakeAPI.getAllCakes(params);
      const { data } = response.data;
      setCakes(data.cakes);
      setPagination(data.pagination);
      setAvailableFilters(data.filters);
    } catch (error) {
      console.error('Error fetching cakes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch with current filters (including URL params)
    fetchCakes(filters);
  }, []);

  useEffect(() => {
    // Clean up unavailable items when homepage loads
    removeUnavailableItems();
  }, []);


  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.search.value;
    const newTempFilters = { ...tempFilters, search: searchValue };
    setTempFilters(newTempFilters);
    const newFilters = { ...filters, search: searchValue };
    setFilters(newFilters);
    fetchCakes(newFilters);
    updateURL(newFilters);
  };

  const handleTempFilterChange = (key, value) => {
    setTempFilters({ ...tempFilters, [key]: value });
  };

  const applyFilters = () => {
    const newFilters = { ...filters, ...tempFilters };
    setFilters(newFilters);
    fetchCakes(newFilters);
    updateURL(newFilters);
    // Update tempFilters to match the applied filters
    setTempFilters({ ...tempFilters });
  };

  const resetFilters = () => {
    const resetTempFilters = {
      search: filters.search,
      flavor: '',
      minPrice: '',
      maxPrice: '',
      category: '',
    };
    setTempFilters(resetTempFilters);
    const newFilters = { ...filters, flavor: '', minPrice: '', maxPrice: '', category: '' };
    setFilters(newFilters);
    fetchCakes(newFilters);
    updateURL(newFilters);
  };

  const updateURL = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };


  // Helper function to get minimum price and weight
  const getMinPriceAndWeight = (cake) => {
    if (!cake.weightOptions || cake.weightOptions.length === 0) {
      return { minPrice: cake.price, minWeight: '1kg' };
    }
    
    const minOption = cake.weightOptions.reduce((min, option) => 
      option.price < min.price ? option : min
    );
    
    return { minPrice: minOption.price, minWeight: minOption.weight };
  };

  // Helper function to get available flavors for a cake
  const getAvailableFlavors = (cake) => {
    if (cake.flavors && cake.flavors.length > 0) {
      return cake.flavors;
    } else if (cake.flavor) {
      return [cake.flavor];
    }
    return [];
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
          Welcome to Ebake 🎂
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover our delicious collection of custom-made cakes, baked with love and delivered with care in Hyderabad.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                name="search"
                type="text"
                placeholder="Search for cakes, flavors..."
                defaultValue={filters.search}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Detailed Filters */}
        {showFilters && (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Flavor Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flavor</label>
                <select
                  value={tempFilters.flavor}
                  onChange={(e) => handleTempFilterChange('flavor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Flavors</option>
                  {availableFilters.availableFlavors?.map((flavor) => (
                    <option key={flavor} value={flavor}>
                      {flavor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={tempFilters.category}
                  onChange={(e) => handleTempFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {availableFilters.availableCategories?.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={tempFilters.minPrice}
                  onChange={(e) => handleTempFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={tempFilters.maxPrice}
                  onChange={(e) => handleTempFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* Apply Filters Button */}
            <div className="flex justify-end gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
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

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {pagination.totalCakes} cakes found
        </p>
        
        {/* Sort */}
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            const newFilters = { ...filters, sortBy, sortOrder };
            setFilters(newFilters);
            fetchCakes(newFilters);
            updateURL(newFilters);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      {/* Cakes Grid */}
      {cakes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎂</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No cakes found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setFilters({
                search: '',
                flavor: '',
                minPrice: '',
                maxPrice: '',
                category: '',
                sortBy: 'createdAt',
                sortOrder: 'desc',
              });
              fetchCakes({});
            }}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cakes.map((cake) => (
            <div key={cake._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <Link to={`/cake/${cake._id}`}>
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={cake.imageUrl}
                    alt={cake.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </Link>
              
              <div className="p-4">
                <Link to={`/cake/${cake._id}`}>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-primary-600 transition-colors">
                    {cake.name}
                  </h3>
                </Link>
                
                <p className="text-gray-600 text-sm mb-2">
                  {selectedFlavor[cake._id] || getAvailableFlavors(cake)[0] || ''}
                </p>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">{cake.description}</p>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {renderStars(cake.averageRating || 0)}
                  <span className="text-sm text-gray-500 ml-1">
                    ({cake.reviewCount || 0})
                  </span>
                </div>

                {/* Flavor Options - Hide for admins, show for all cakes */}
                {!isAdmin() && (() => {
                  const availableFlavors = getAvailableFlavors(cake);
                  return availableFlavors.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Select Flavor:</label>
                      <select
                        value={selectedFlavor[cake._id] || availableFlavors[0] || ''}
                        onChange={(e) => setSelectedFlavor({...selectedFlavor, [cake._id]: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {availableFlavors.map((flavor) => (
                          <option key={flavor} value={flavor}>
                            {flavor}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* Price Display - Hide for admins */}
                {(() => {
                  const { minPrice, minWeight } = getMinPriceAndWeight(cake);
                  const hasMultipleWeights = cake.weightOptions && cake.weightOptions.length > 1;
                  
                  return (
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-bold text-primary-600">
                          ₹{minPrice}
                        </div>
                        <div className="text-sm text-gray-600">
                          Starting from {minWeight}
                          {hasMultipleWeights && ' (More options available)'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* View Details Button - Hide for admins */}
                {!isAdmin() && (
                  <Link to={`/cake/${cake._id}`} className="block">
                    <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium">
                      View Details & Order
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchCakes({ ...filters, page: pagination.currentPage - 1 })}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => fetchCakes({ ...filters, page: pagination.currentPage + 1 })}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
