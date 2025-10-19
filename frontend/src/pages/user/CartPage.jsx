import { Link, useNavigate,  } from 'react-router-dom';
import { useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items, totalItems, totalAmount, updateQuantity, removeFromCart, clearCart, removeUnavailableItems } = useCartStore();
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin - admins cannot access cart
    if (isAdmin()) {
      toast.error('Admins cannot access cart. Please use a customer account.');
      navigate('/admin');
      return;
    }

    // Clean up unavailable items when cart page loads
    removeUnavailableItems();
  }, [isAdmin, navigate]);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any cakes to your cart yet.</p>
          <Link to="/" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={`${item.cakeId}-${item.weight}-${item.selectedFlavor || 'default'}`} className="flex items-center space-x-4 border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                      <p className="text-gray-600">{item.selectedFlavor || item.flavor}</p>
                      <p className="text-sm text-gray-500">Weight: {item.weight}</p>
                      <p className="text-lg font-semibold text-primary-600">₹{item.price}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.cakeId, item.weight, item.quantity - 1, item.selectedFlavor)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cakeId, item.weight, item.quantity + 1, item.selectedFlavor)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-lg">₹{item.price * item.quantity}</p>
                      <button
                        onClick={() => removeFromCart(item.cakeId, item.weight, item.selectedFlavor)}
                        className="text-red-600 hover:text-red-700 mt-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({totalItems})</span>
                <span className="font-medium">₹{totalAmount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium">Free</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-primary-600">₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
            >
              Proceed to Checkout
              <ArrowRight size={20} />
            </Link>

            <Link
              to="/"
              className="block w-full text-center mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
