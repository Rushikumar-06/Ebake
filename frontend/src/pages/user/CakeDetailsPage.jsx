import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { cakeAPI } from '../../lib/api';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import CartProtectedAction from '../../components/CartProtectedAction';

const CakeDetailsPage = () => {
  const { id } = useParams();
  const [cake, setCake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  
  const { addToCart, isInCart, getCartItem, updateQuantity } = useCartStore();
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCake = async () => {
      try {
        const response = await cakeAPI.getCakeById(id);
        setCake(response.data.cake);
        if (response.data.cake.weightOptions?.length > 0) {
          setSelectedWeight(response.data.cake.weightOptions[0].weight);
        }
        
        // Set initial flavor selection
        const cake = response.data.cake;
        if (cake.flavors && cake.flavors.length > 0) {
          setSelectedFlavor(cake.flavors[0]);
        } else {
          setSelectedFlavor(cake.flavor || '');
        }
      } catch (error) {
        console.error('Error fetching cake:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCake();
  }, [id]);

  const handleAddToCart = () => {
    if (selectedWeight && cake) {
      addToCart(cake, selectedWeight, selectedFlavor);
    }
  };

  const handleIncrement = () => {
    if (selectedWeight && cake) {
      const cartItem = getCartItem(cake._id, selectedWeight, selectedFlavor);
      if (cartItem) {
        updateQuantity(cake._id, selectedWeight, cartItem.quantity + 1, selectedFlavor);
      }
    }
  };

  const handleDecrement = () => {
    if (selectedWeight && cake) {
      const cartItem = getCartItem(cake._id, selectedWeight, selectedFlavor);
      if (cartItem) {
        updateQuantity(cake._id, selectedWeight, cartItem.quantity - 1, selectedFlavor);
      }
    }
  };

  const getSelectedPrice = () => {
    if (!cake || !selectedWeight) return 0;
    const option = cake.weightOptions.find(opt => opt.weight === selectedWeight);
    return option ? option.price : 0;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
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

  if (!cake) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cake not found</h1>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        to="/" 
        className="flex items-center text-primary-600 hover:text-primary-700 mb-8"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Cakes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={cake.imageUrl}
            alt={cake.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{cake.name}</h1>
            <p className="text-xl text-gray-600 mb-4">
              {selectedFlavor || cake.flavor}
            </p>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              {renderStars(cake.averageRating || 0)}
              <span className="text-sm text-gray-500">({cake.reviewCount || 0} reviews)</span>
            </div>
          </div>

          <div>
            <p className="text-gray-700 leading-relaxed">{cake.description}</p>
          </div>

          {/* Flavor Options */}
          {cake.flavors && cake.flavors.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Flavors</h3>
              <div className="space-y-3">
                {cake.flavors.map((flavor) => (
                  <label key={flavor} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="flavor"
                      value={flavor}
                      checked={selectedFlavor === flavor}
                      onChange={(e) => setSelectedFlavor(e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-medium p-3 border border-gray-200 rounded-lg hover:border-primary-300 flex-1">
                      {flavor}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Weight Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Sizes</h3>
            <div className="space-y-3">
              {cake.weightOptions.map((option) => (
                <label key={option.weight} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="weight"
                    value={option.weight}
                    checked={selectedWeight === option.weight}
                    onChange={(e) => setSelectedWeight(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1 flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:border-primary-300">
                    <span className="font-medium">{option.weight}</span>
                    <span className="text-lg font-semibold text-primary-600">₹{option.price}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-2xl font-bold text-gray-900">
                ₹{getSelectedPrice()}
              </span>
              <span className="text-sm text-gray-500">for {selectedWeight}</span>
            </div>

            {!isAdmin() && (() => {
              const itemInCart = isInCart(cake._id, selectedWeight, selectedFlavor);
              const cartItem = getCartItem(cake._id, selectedWeight, selectedFlavor);
              
              if (itemInCart && cartItem && selectedWeight) {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleDecrement}
                        className="flex items-center justify-center w-10 h-10 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="px-6 py-3 text-lg font-medium text-gray-700 bg-gray-50 rounded-lg min-w-[4rem] text-center">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={handleIncrement}
                        className="flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <button
                      onClick={() => navigate('/cart')}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                    >
                      <ShoppingCart size={20} />
                      View Cart
                    </button>
                  </div>
                );
              } else {
                return (
                  <CartProtectedAction action={handleAddToCart}>
                    <button
                      disabled={!selectedWeight}
                      className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={20} />
                      Add to Cart
                    </button>
                  </CartProtectedAction>
                );
              }
            })()}
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Delivery Information</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Free delivery within Hyderabad</li>
              <li>• Estimated delivery: 2-3 days</li>
              <li>• Freshly baked on order</li>
              <li>• Custom messages available</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CakeDetailsPage;
