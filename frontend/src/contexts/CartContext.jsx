import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'USD');
  const [rates, setRates] = useState({ USD: 1 });

  // Load cart from server when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/payment/currency/rates')
      .then(res => setRates(res.data.rates))
      .catch(() => setRates({ USD: 1 }));
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/cart');
      setCart(response.data.cart || []);
    } catch (error) {
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      if (!isAuthenticated) {
        // For non-authenticated users, store in localStorage
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = localCart.find(item => item.productId === productId);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          localCart.push({ productId, quantity });
        }
        
        localStorage.setItem('cart', JSON.stringify(localCart));
        setCart(localCart);
        return { success: true };
      }

      // For authenticated users, save to server
      const response = await axios.post('/cart', { productId, quantity });
      setCart(response.data.cart);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add to cart' 
      };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      if (!isAuthenticated) {
        // For non-authenticated users, remove from localStorage
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = localCart.filter(item => item.productId !== productId);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        setCart(updatedCart);
        return { success: true };
      }

      // For authenticated users, remove from server
      const response = await axios.delete(`/cart/${productId}`);
      setCart(response.data.cart);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to remove from cart' 
      };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (!isAuthenticated) {
        // For non-authenticated users, update in localStorage
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const item = localCart.find(item => item.productId === productId);
        if (item) {
          item.quantity = quantity;
          localStorage.setItem('cart', JSON.stringify(localCart));
          setCart(localCart);
        }
        return { success: true };
      }

      // For authenticated users, update on server
      const response = await axios.put(`/cart/${productId}`, { quantity });
      setCart(response.data.cart);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update quantity' 
      };
    }
  };

  const clearCart = async () => {
    try {
      if (!isAuthenticated) {
        localStorage.removeItem('cart');
        setCart([]);
        return { success: true };
      }

      await axios.delete('/cart');
      setCart([]);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to clear cart' 
      };
    }
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const convertPrice = (usdAmount) => {
    if (!rates[currency]) return usdAmount;
    return usdAmount * rates[currency];
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    cartItemCount: getCartItemCount(),
    currency,
    setCurrency,
    rates,
    convertPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 