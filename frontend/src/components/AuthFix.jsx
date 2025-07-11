import React, { useState } from 'react';

const AuthFix = () => {
  const [isVisible, setIsVisible] = useState(true);

  const clearAllAuth = () => {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Clear localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reload the page
    window.location.reload();
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  const hideWidget = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-900">🔧 Auth Fix</h3>
        <button 
          onClick={hideWidget}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          ×
        </button>
      </div>
      <div className="space-y-2">
        <button
          onClick={clearAllAuth}
          className="w-full px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🧹 Clear All Auth
        </button>
        <button
          onClick={goToLogin}
          className="w-full px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          🔑 Go to Login
        </button>
        <div className="text-xs text-gray-500 mt-2">
          Click "Clear All Auth" then "Go to Login"
        </div>
      </div>
    </div>
  );
};

export default AuthFix; 