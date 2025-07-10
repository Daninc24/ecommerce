import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Helmet } from 'react-helmet';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const [cartProducts, setCartProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch product details for cart items
  useEffect(() => {
    const fetchCartProducts = async () => {
      if (cart.length === 0) {
        setCartProducts([]);
        setLoading(false);
        return;
      }

      try {
        const productIds = cart.map(item => item.productId || item._id);
        const response = await axios.get('/products');
        const products = response.data.filter(product => 
          productIds.includes(product._id)
        );

        const cartWithProducts = cart.map(cartItem => {
          const product = products.find(p => p._id === (cartItem.productId || cartItem._id));
          return {
            ...cartItem,
            ...product,
            price: product?.price || 0,
            title: product?.title || 'Unknown Product',
            image: product?.images?.[0] || product?.image || '/placeholder-image.jpg',
            category: product?.category || 'Unknown Category'
          };
        });

        setCartProducts(cartWithProducts);
      } catch (err) {
        error('Error loading cart items');
      } finally {
        setLoading(false);
      }
    };

    fetchCartProducts();
  }, [cart, error]);

  const subtotal = cartProducts.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  const shipping = subtotal > 50 ? 0 : 10;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleCheckout = () => {
    if (!user) {
      error('Please login to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cartProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
              <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <div className="space-y-3">
              <Link
                to="/products"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cart - MyShopping Center</title>
        <meta name="description" content="View and manage your shopping cart at MyShopping Center. Ready for checkout!" />
        <meta property="og:title" content="Cart - MyShopping Center" />
        <meta property="og:description" content="View and manage your shopping cart at MyShopping Center. Ready for checkout!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://myshoppingcenter.com/cart" />
        <meta property="og:image" content="https://myshoppingcenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cart - MyShopping Center" />
        <meta name="twitter:description" content="View and manage your shopping cart at MyShopping Center. Ready for checkout!" />
        <meta name="twitter:image" content="https://myshoppingcenter.com/logo.png" />
        <link rel="canonical" href="https://myshoppingcenter.com/cart" />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {cartProducts.length} item{cartProducts.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                  <button
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {cartProducts.map((item) => (
                    <div key={item._id || item.productId} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-1">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {item.category}
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                ${(item.price || 0).toFixed(2)}
                              </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  onClick={() => handleQuantityChange(item._id || item.productId, (item.quantity || 1) - 1)}
                                  className="p-2 hover:bg-gray-50 transition-colors"
                                  disabled={(item.quantity || 1) <= 1}
                                >
                                  <MinusIcon className="h-4 w-4 text-gray-600" />
                                </button>
                                <span className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[3rem] text-center">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item._id || item.productId, (item.quantity || 1) + 1)}
                                  className="p-2 hover:bg-gray-50 transition-colors"
                                >
                                  <PlusIcon className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveItem(item._id || item.productId)}
                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="mt-4 sm:mt-2 text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-96">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Free Shipping Notice */}
                {shipping > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                    <p className="text-sm text-blue-800">
                      Add ${(50 - subtotal).toFixed(2)} more to get free shipping!
                    </p>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </button>

                {/* Continue Shopping */}
                <Link
                  to="/products"
                  className="w-full mt-3 bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Continue Shopping
                </Link>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    🔒 Secure checkout powered by SSL encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart; 