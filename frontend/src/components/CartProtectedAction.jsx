import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const CartProtectedAction = ({ children, action }) => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleAction = (event) => {
    // Check if the button is disabled
    if (event?.target?.disabled || event?.currentTarget?.disabled) {
      return;
    }

    if (!isAuthenticated) {
      // Redirect to login with current page as return URL
      navigate('/login', { 
        state: { 
          from: window.location.pathname,
          message: 'Please login to add items to cart'
        } 
      });
      return;
    }

    // Check if user is admin - admins cannot add to cart
    if (isAdmin()) {
      toast.error('Admins cannot add items to cart. Please use a customer account.');
      return;
    }
    
    // If authenticated and not admin, proceed with the action
    if (action && typeof action === 'function') {
      action();
    }
  };

  // Clone the children and add the onClick handler
  if (typeof children === 'function') {
    return children(handleAction);
  }

  return (
    <div onClick={handleAction}>
      {children}
    </div>
  );
};

export default CartProtectedAction;
