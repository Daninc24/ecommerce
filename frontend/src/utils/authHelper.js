// Authentication helper utilities
import axios from 'axios';

// Clear all authentication state
export const clearAuthState = () => {
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Clear localStorage if any
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  // Clear axios defaults
  delete axios.defaults.headers.common['Authorization'];
  
  // Reload the page to reset all state
  window.location.reload();
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return document.cookie.includes('token=');
};

// Force logout and redirect to login
export const forceLogout = () => {
  clearAuthState();
  window.location.href = '/login';
};

// Handle 401 errors globally
export const setupAuthErrorHandler = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        forceLogout();
      }
      return Promise.reject(error);
    }
  );
}; 