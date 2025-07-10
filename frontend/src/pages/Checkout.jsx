import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../config/stripe';
import PaymentForm from '../components/PaymentForm';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { Helmet } from 'react-helmet';

const Checkout = () => {
  const { cart, clearCart, currency, convertPrice } = useCart();
  const { success, error } = useToast();
  const [cartProducts, setCartProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartProducts = async () => {
      if (cart.length === 0) {
        navigate('/cart');
        return;
      }

      try {
        const productIds = cart.map(item => item.productId);
        const response = await axios.get('/products');
        const products = response.data.filter(product => 
          productIds.includes(product._id)
        );

        const cartWithProducts = cart.map(cartItem => {
          const product = products.find(p => p._id === cartItem.productId);
          return {
            ...cartItem,
            product
          };
        });

        setCartProducts(cartWithProducts);
        
        const totalAmount = cartWithProducts.reduce((sum, item) => {
          return sum + (item.product?.price * item.quantity);
        }, 0);
        
        setTotal(totalAmount);
      } catch (err) {
        error('Error loading cart items');
      }
    };

    fetchCartProducts();
  }, [cart, navigate, error]);

  const handlePaymentSuccess = (order) => {
    success('Order placed successfully!');
    navigate('/profile');
  };

  const handlePaymentError = (err) => {
    error('Payment failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - MyShopping Center</title>
        <meta name="description" content="Complete your purchase at MyShopping Center. Secure payment and fast delivery!" />
        <meta property="og:title" content="Checkout - MyShopping Center" />
        <meta property="og:description" content="Complete your purchase at MyShopping Center. Secure payment and fast delivery!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://myshoppingcenter.com/checkout" />
        <meta property="og:image" content="https://myshoppingcenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Checkout - MyShopping Center" />
        <meta name="twitter:description" content="Complete your purchase at MyShopping Center. Secure payment and fast delivery!" />
        <meta name="twitter:image" content="https://myshoppingcenter.com/logo.png" />
        <link rel="canonical" href="https://myshoppingcenter.com/checkout" />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
            
            {cartProducts.map((item) => (
              <div key={item.productId} className="card flex items-center space-x-4">
                <img
                  src={item.product?.images?.[0] || item.product?.image}
                  alt={item.product?.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{item.product?.title}</h3>
                  <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                  <p className="text-blue-600 font-semibold">
                    {currency === 'USD'
                      ? `$${(item.product?.price * item.quantity).toFixed(2)} USD`
                      : `${convertPrice(item.product?.price * item.quantity).toFixed(2)} ${currency} / $${(item.product?.price * item.quantity).toFixed(2)} USD`}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="card">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">
                    {currency === 'USD'
                      ? `$${total.toFixed(2)} USD`
                      : `${convertPrice(total).toFixed(2)} ${currency} / $${total.toFixed(2)} USD`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold">Free</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    {currency === 'USD'
                      ? `$${total.toFixed(2)} USD`
                      : `${convertPrice(total).toFixed(2)} ${currency} / $${total.toFixed(2)} USD`}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="space-y-6">
            <Elements stripe={stripePromise}>
              <PaymentForm 
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </Elements>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout; 