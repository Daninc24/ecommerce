import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const gatewayFields = {
  stripe: [
    { key: 'secretKey', label: 'Stripe Secret Key', type: 'password' }
  ],
  paypal: [
    { key: 'clientId', label: 'PayPal Client ID', type: 'text' },
    { key: 'clientSecret', label: 'PayPal Client Secret', type: 'password' }
  ],
  mpesa: [
    { key: 'consumerKey', label: 'Mpesa Consumer Key', type: 'text' },
    { key: 'consumerSecret', label: 'Mpesa Consumer Secret', type: 'password' },
    { key: 'shortcode', label: 'Mpesa Shortcode', type: 'text' },
    { key: 'passkey', label: 'Mpesa Passkey', type: 'password' }
  ]
};

const AdminPaymentSettings = () => {
  const [credentials, setCredentials] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/payment-credentials');
      const creds = {};
      res.data.forEach(c => { creds[c.gateway] = c.credentials; });
      setCredentials(creds);
    } catch (err) {
      error('Failed to load payment credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (gateway, key, value) => {
    setCredentials(prev => ({
      ...prev,
      [gateway]: { ...prev[gateway], [key]: value }
    }));
  };

  const handleSave = async (gateway) => {
    setSaving(true);
    try {
      await axios.put(`/payment-credentials/${gateway}`, {
        credentials: credentials[gateway]
      });
      success(`${gateway.charAt(0).toUpperCase() + gateway.slice(1)} credentials updated!`);
    } catch (err) {
      error('Failed to update credentials');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Payment Gateway Settings</h1>
      {Object.keys(gatewayFields).map(gateway => (
        <div key={gateway} className="bg-white rounded shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 capitalize">{gateway} Credentials</h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave(gateway);
            }}
            className="space-y-4"
          >
            {gatewayFields[gateway].map(field => (
              <div key={field.key}>
                <label className="block font-medium mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={credentials[gateway]?.[field.key] || ''}
                  onChange={e => handleChange(gateway, field.key, e.target.value)}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              className="btn-primary mt-4"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      ))}
    </div>
  );
};

export default AdminPaymentSettings; 