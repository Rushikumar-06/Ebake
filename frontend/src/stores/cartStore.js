import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { cakeAPI } from '../lib/api';

const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      totalItems: 0,
      totalAmount: 0,

      // Actions
      addToCart: (cake, selectedWeight, selectedFlavor = null) => {
        const { items } = get();
        
        // Check if cake is available
        if (!cake.isAvailable) {
          toast.error('This cake is not available for ordering');
          return;
        }
        
        // Find the price for selected weight
        const weightOption = cake.weightOptions.find(
          option => option.weight === selectedWeight
        );
        
        if (!weightOption) {
          toast.error('Invalid weight selection');
          return;
        }

        // Determine the selected flavor
        const itemFlavor = selectedFlavor || cake.flavor || 
          (cake.flavors && cake.flavors.length > 0 ? cake.flavors[0] : '');

        const existingItemIndex = items.findIndex(
          item => item.cakeId === cake._id && item.weight === selectedWeight && item.selectedFlavor === itemFlavor
        );

        if (existingItemIndex > -1) {
          // Update existing item quantity
          const newItems = [...items];
          newItems[existingItemIndex].quantity += 1;
          
          set({ items: newItems });
          get().calculateTotals();
          
          // Show toast with View Cart button for quantity updates too
          toast.success(`${cake.name} quantity updated in cart! Click here to view cart`, {
            duration: 4000,
            onClick: () => {
              window.location.pathname = '/cart';
            },
            style: {
              cursor: 'pointer'
            }
          });
        } else {
          // Add new item
          const newItem = {
            cakeId: cake._id,
            name: cake.name,
            flavor: cake.flavor,
            selectedFlavor: itemFlavor,
            availableFlavors: cake.flavors || [cake.flavor],
            imageUrl: cake.imageUrl,
            weight: selectedWeight,
            price: weightOption.price,
            quantity: 1,
          };
          
          set({ items: [...items, newItem] });
          get().calculateTotals();
          
          // Show toast with View Cart button
          toast.success(`${cake.name} added to cart! Click here to view cart`, {
            duration: 4000,
            onClick: () => {
              window.location.pathname = '/cart';
            },
            style: {
              cursor: 'pointer'
            }
          });
        }
      },

      removeFromCart: (cakeId, weight, selectedFlavor = null) => {
        const { items } = get();
        const cake = items.find(
          item => item.cakeId === cakeId && item.weight === weight && 
            (selectedFlavor === null || item.selectedFlavor === selectedFlavor)
        );
        
        if (cake) {
          const newItems = items.filter(
            item => !(item.cakeId === cakeId && item.weight === weight && 
              (selectedFlavor === null || item.selectedFlavor === selectedFlavor))
          );
          
          set({ items: newItems });
          get().calculateTotals();
          toast.success(`${cake.name} removed from cart!`);
        }
      },

      updateQuantity: (cakeId, weight, newQuantity, selectedFlavor = null) => {
        if (newQuantity < 1) {
          get().removeFromCart(cakeId, weight, selectedFlavor);
          return;
        }

        const { items } = get();
        const newItems = items.map(item => 
          item.cakeId === cakeId && item.weight === weight && 
            (selectedFlavor === null || item.selectedFlavor === selectedFlavor)
            ? { ...item, quantity: newQuantity }
            : item
        );
        
        set({ items: newItems });
        get().calculateTotals();
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalAmount: 0 });
        toast.success('Cart cleared!');
      },

      calculateTotals: () => {
        const { items } = get();
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        );
        
        set({ totalItems, totalAmount });
      },

      getCartItems: () => {
        return get().items;
      },

      getCartItem: (cakeId, weight, selectedFlavor = null) => {
        const { items } = get();
        return items.find(
          item => item.cakeId === cakeId && item.weight === weight && 
            (selectedFlavor === null || item.selectedFlavor === selectedFlavor)
        );
      },

      isInCart: (cakeId, weight, selectedFlavor = null) => {
        const { items } = get();
        return items.some(
          item => item.cakeId === cakeId && item.weight === weight && 
            (selectedFlavor === null || item.selectedFlavor === selectedFlavor)
        );
      },

      // Remove unavailable items from cart
      removeUnavailableItems: async () => {
        const { items } = get();
        if (items.length === 0) return;

        try {
          // Get all unique cake IDs from cart items
          const cakeIds = [...new Set(items.map(item => item.cakeId))];
          
          // Check which cakes are still available
          const unavailableCakeIds = [];
          
          for (const cakeId of cakeIds) {
            try {
              const response = await cakeAPI.getCakeById(cakeId);
              if (!response.data.success || !response.data.cake.isAvailable) {
                unavailableCakeIds.push(cakeId);
              }
            } catch (error) {
              // If we get an error (404, etc.), consider the cake unavailable
              unavailableCakeIds.push(cakeId);
            }
          }
          
          if (unavailableCakeIds.length > 0) {
            const { items: currentItems } = get();
            const newItems = currentItems.filter(item => 
              !unavailableCakeIds.includes(item.cakeId)
            );
            
            // Only update if items were removed
            if (newItems.length !== currentItems.length) {
              set({ items: newItems });
              get().calculateTotals();
              
              const removedCount = currentItems.length - newItems.length;
              toast.error(`${removedCount} unavailable item(s) removed from cart`);
            }
          }
        } catch (error) {
          console.error('Error checking cake availability:', error);
        }
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

export default useCartStore;
