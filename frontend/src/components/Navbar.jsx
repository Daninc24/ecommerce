import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, UserIcon, Bars3Icon, XMarkIcon, Cog6ToothIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { io } from 'socket.io-client';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const [currencies, setCurrencies] = useState(['USD']);
  const [selectedCurrency, setSelectedCurrency] = useState(() => localStorage.getItem('currency') || 'USD');

  // Socket.IO for online status
  useEffect(() => {
    if (!user) return;
    if (socketRef.current) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ecommerce-do0x.onrender.com', {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('online_users', (users) => {
      setOnlineUsers(users);
    });
    socket.emit('get_online_users');
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/payment/currency/list')
      .then(res => setCurrencies(res.data.currencies))
      .catch(() => setCurrencies(['USD']));
  }, []);

  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
    localStorage.setItem('currency', e.target.value);
    window.location.reload(); // reload to propagate currency change (can be improved with context)
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                MyShopping
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Products
            </Link>
            
            {/* Currency Selector */}
            <select
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={{ minWidth: 80 }}
              title="Select currency"
            >
              {currencies.map(cur => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>

            {/* Cart Icon */}
            <Link to="/cart" className="relative text-gray-700 hover:text-orange-600 transition-colors">
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            {/* Chat Icon */}
            {user && (
              <Link to="/messages" className="text-gray-700 hover:text-orange-600" title="Messages">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </Link>
            )}
            {/* POS Link: Show for all allowed roles */}
            {user && [
              'admin',
              'employee',
              'shopkeeper',
              'delivery',
              'moderator',
              'store_manager',
              'warehouse_manager',
              'manager',
            ].includes(user.role) && (
              <Link 
                to="/pos" 
                className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                POS
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative group flex items-center">
                <button className="flex items-center text-gray-700 hover:text-orange-600 transition-colors">
                  {user.profileImage ? (
                    <span className="relative inline-block">
                      <img src={user.profileImage} alt="Avatar" className="h-8 w-8 rounded-full object-cover mr-2 border" />
                      {/* Online status dot */}
                      <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white ${onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </span>
                  ) : (
                    <span className="relative inline-block">
                      <UserIcon className="h-6 w-6 mr-1" />
                      {/* Online status dot */}
                      <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white ${onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </span>
                  )}
                  <span className="text-sm font-medium hidden lg:block">{user.name}</span>
                </button>
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  {(user.role === 'admin' || user.role === 'manager' || user.role === 'warehouse_manager' || user.role === 'store_manager') && (
                    <>
                      <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><ChartBarIcon className="h-4 w-4 mr-2" />Dashboard</Link>
                      <Link to="/admin/products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"><Cog6ToothIcon className="h-4 w-4 mr-2" />Manage Products</Link>
                      <Link to="/admin/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Orders</Link>
                      <Link to="/admin/payment-settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Payment Settings</Link>
                      <Link to="/admin/events" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Events</Link>
                      <Link to="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Users</Link>
                      <Link to="/admin/sales-report" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Sales Report</Link>
                      <Link to="/admin/inventory-logs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Inventory Logs</Link>
                      <Link to="/admin/performance-dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Performance Dashboard</Link>
                      <Link to="/admin/adverts" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">Manage Adverts</Link>
                    </>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-orange-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/cart" 
              className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Cart ({cartItemCount})
            </Link>
            {user && [
              'admin',
              'employee',
              'shopkeeper',
              'delivery',
              'moderator',
              'store_manager',
              'warehouse_manager',
              'manager',
            ].includes(user.role) && (
              <Link 
                to="/pos" 
                className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                POS
              </Link>
            )}
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                {(user.role === 'admin' || user.role === 'manager' || user.role === 'warehouse_manager' || user.role === 'store_manager') && (
                  <>
                    <Link to="/admin" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}><ChartBarIcon className="h-5 w-5 mr-2" />Dashboard</Link>
                    <Link to="/admin/products" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}><Cog6ToothIcon className="h-5 w-5 mr-2" />Manage Products</Link>
                    <Link to="/admin/orders" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link>
                    <Link to="/admin/payment-settings" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Payment Settings</Link>
                    <Link to="/admin/events" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Events</Link>
                    <Link to="/admin/users" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Users</Link>
                    <Link to="/admin/sales-report" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Sales Report</Link>
                    <Link to="/admin/inventory-logs" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Inventory Logs</Link>
                    <Link to="/admin/performance-dashboard" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Performance Dashboard</Link>
                    <Link to="/admin/adverts" className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium flex items-center" onClick={() => setIsMobileMenuOpen(false)}>Manage Adverts</Link>
                  </>
                )}
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 