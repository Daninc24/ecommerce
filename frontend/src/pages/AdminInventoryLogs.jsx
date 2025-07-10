import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminInventoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchLogs();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data || []);
    } catch {}
  };

  const fetchLogs = async (pid = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/products/logs/${pid}`);
      setLogs(res.data.logs || []);
    } catch {
      setError('Failed to fetch inventory logs');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    setProductId(e.target.value);
    fetchLogs(e.target.value);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Adjustment Logs</h1>
      <div className="mb-4 flex gap-4 items-center">
        <label className="font-medium">Filter by Product:</label>
        <select
          className="border rounded px-2 py-1"
          value={productId}
          onChange={handleProductChange}
        >
          <option value="">All Products</option>
          {products.map(p => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Date</th>
                <th>Product</th>
                <th>User</th>
                <th>Role</th>
                <th>Change</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id} className="border-t">
                  <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.product?.title || '-'}</td>
                  <td>{log.user?.name || '-'}</td>
                  <td>{log.user?.role || '-'}</td>
                  <td className={log.change > 0 ? 'text-green-600' : 'text-red-600'}>{log.change > 0 ? '+' : ''}{log.change}</td>
                  <td>{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryLogs; 