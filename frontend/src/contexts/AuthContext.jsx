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
  apiBase = apiBase.replace(/\/+$/, '').replace(/\/api$/, '');
  axios.defaults.baseURL = apiBase + '/api';
  axios.defaults.withCredentials = true;

  // Add response interceptor to handle 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('401 error detected, clearing user state');
          setUser(null);
          // Clear cookies
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      console.log('Auth check failed:', error.message);
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
      console.log('Login error:', error.response?.data?.message || error.message);
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
    } catch (error) {
      console.log('Logout error:', error.message);
    } finally {
      setUser(null);
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    return { success: true };
  };

  const loginWithGoogle = () => {
    let apiBase = import.meta.env.VITE_API_URL || 'https://ecommerce-do0x.onrender.com';
    apiBase = apiBase.replace(/\/+$/, '').replace(/\/api$/, '');
    window.location.href = apiBase + '/api/auth/google';
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