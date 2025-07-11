import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

const PaymentForm = ({ onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { cart, clearCart, currency, convertPrice } = useCart();
  const { error: showError, success } = useToast();

  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  useEffect(() => {
    if (cart && cart.length > 0) {
      createPaymentIntent();
    }
  }, [cart]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const localAmount = cart.reduce((sum, item) => sum + convertPrice(item.product?.price * item.quantity), 0);
      const response = await axios.post('/api/payment/create-payment-intent', {
        items: cart,
        currency,
      });
      if (response.data.developmentMode) {
        setStripeConfigured(false);
        showError(response.data.message);
        return;
      }
      setClientSecret(response.data.clientSecret);
      setTotalAmount(response.data.localAmount || response.data.totalAmount);
    } catch (err) {
      setStripeConfigured(false);
      showError('Payment system is not properly configured.');
      onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setLoading(true);
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });
      if (stripeError) {
        showError(stripeError.message);
        onPaymentError(stripeError);
        return;
      }
      if (paymentIntent.status === 'succeeded') {
        const response = await axios.post('/api/payment/confirm-payment', {
          paymentIntentId: paymentIntent.id,
          items: cart,
          shippingAddress: address
        });
        await clearCart();
        setPaymentComplete(true);
        onPaymentSuccess(response.data.order);
      }
    } catch (err) {
      showError('Card payment failed.');
      onPaymentError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalApprove = async (data) => {
    setPaypalLoading(true);
    try {
      const captureRes = await axios.post('/api/payment/paypal/capture-order', {
        orderID: data.orderID,
      });

      if (
        captureRes.data.status === 'COMPLETED' ||
        captureRes.data.details?.status === 'COMPLETED'
      ) {
        success('PayPal payment successful!');
        await clearCart();
        setPaymentComplete(true);
        onPaymentSuccess(captureRes.data.details);
      } else {
        showError('PayPal payment not completed.');
        onPaymentError(captureRes.data);
      }
    } catch (err) {
      showError('PayPal payment failed.');
      onPaymentError(err);
    } finally {
      setPaypalLoading(false);
    }
  };

  const handleMpesaPayment = async () => {
    setMpesaLoading(true);
    try {
      const res = await axios.post('/api/payment/mpesa/initiate', {
        phone: mpesaPhone,
        amount: totalAmount,
      });

      success('Mpesa STK push sent. Complete payment on your phone.');
      setPaymentComplete(true);
      await clearCart();
      onPaymentSuccess(res.data);
    } catch (err) {
      showError('Mpesa payment failed.');
      onPaymentError(err);
    } finally {
      setMpesaLoading(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="card text-center p-6">
        <h2 className="text-2xl font-bold text-green-600 mb-4">✅ Payment Complete</h2>
        <p className="text-gray-700">Thank you for your purchase! Your order has been successfully processed.</p>
      </div>
    );
  }

  if (!stripeConfigured) {
    return (
      <div className="card p-6 text-center text-red-600">
        <h3 className="text-lg font-semibold">Payment Not Configured</h3>
        <p>Please contact the administrator to set up payment credentials.</p>
      </div>
    );
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': { color: '#aab7c4' },
      },
      invalid: { color: '#9e2146' },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Street</label>
            <input type="text" name="street" value={address.street} onChange={handleAddressChange} className="border p-2 rounded-md w-full" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">City</label>
            <input type="text" name="city" value={address.city} onChange={handleAddressChange} className="border p-2 rounded-md w-full" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">State</label>
            <input type="text" name="state" value={address.state} onChange={handleAddressChange} className="border p-2 rounded-md w-full" required />
          </div>
          <div>
            <label className="block mb-1 font-medium">Zip Code</label>
            <input type="text" name="zipCode" value={address.zipCode} onChange={handleAddressChange} className="border p-2 rounded-md w-full" required />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Country</label>
            <input type="text" name="country" value={address.country} onChange={handleAddressChange} className="border p-2 rounded-md w-full" required />
          </div>
        </div>
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="border p-2 rounded-md mb-4"
        >
          <option value="card">Card</option>
          <option value="paypal">PayPal</option>
          <option value="mpesa">Mpesa</option>
        </select>

        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <label className="block mb-2 font-medium">Card Details</label>
            <div className="border p-3 rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
            <button
              type="submit"
              disabled={loading || !stripe}
              className="btn-primary w-full"
            >
              {loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
            </button>
          </div>
        )}

        {paymentMethod === 'paypal' && PAYPAL_CLIENT_ID && (
          <PayPalScriptProvider options={{ 'client-id': PAYPAL_CLIENT_ID, currency: 'USD' }}>
            <PayPalButtons
              style={{ layout: 'vertical' }}
              createOrder={async (data, actions) => {
                const usdTotal = cart.reduce((sum, item) => sum + (item.product?.price * item.quantity), 0);
                const res = await axios.post('/api/payment/paypal/create-order', {
                  totalAmount: usdTotal,
                  currency,
                });
                return res.data.id;
              }}
              onApprove={handlePayPalApprove}
              disabled={paypalLoading}
            />
          </PayPalScriptProvider>
        )}

        {paymentMethod === 'mpesa' && (
          <div className="space-y-3">
            <label className="block font-medium">Mpesa Phone Number</label>
            <input
              type="tel"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="e.g. 2547XXXXXXXX"
              required
              className="border p-2 rounded-md w-full"
            />
            <button
              type="button"
              onClick={handleMpesaPayment}
              disabled={mpesaLoading || !mpesaPhone}
              className="btn-primary w-full"
            >
              {mpesaLoading ? 'Processing...' : 'Pay with Mpesa'}
            </button>
          </div>
        )}
      </div>

      <div className="card mt-6">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;