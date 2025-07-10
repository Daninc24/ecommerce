import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  let apiBase = import.meta.env.VITE_API_URL || 'https://ecommerce-do0x.onrender.com';
  if (!apiBase.endsWith('/api')) apiBase += '/api';
  axios.defaults.baseURL = apiBase;
  axios.defaults.withCredentials = true;

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/auth/register', { name, email, password });
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Logout failed' 
      };
    }
  };

  const loginWithGoogle = () => {
    window.location.href = (import.meta.env.VITE_API_URL || 'https://ecommerce-do0x.onrender.com/api') + '/auth/google';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isShopkeeper: user?.role === 'shopkeeper',
    isStoreManager: user?.role === 'store_manager',
    isWarehouseManager: user?.role === 'warehouse_manager',
    isManagerOrAdmin: user?.role === 'admin' || user?.role === 'manager' || user?.role === 'warehouse_manager' || user?.role === 'store_manager',
    isShopkeeperOrAdmin: user?.role === 'shopkeeper' || user?.role === 'admin',
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 