import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
Chart.register(...registerables);

const periods = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const AdminSalesReport = () => {
  const [period, setPeriod] = useState('daily');
  const [summary, setSummary] = useState([]);
  const [byShopkeeper, setByShopkeeper] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [byPayment, setByPayment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, shopkeeperRes, productRes, paymentRes] = await Promise.all([
        axios.get(`/pos/sales/summary?period=${period}`),
        axios.get('/pos/sales/by-shopkeeper'),
        axios.get('/pos/sales/by-product'),
        axios.get('/pos/sales/by-payment-method'),
      ]);
      setSummary(summaryRes.data.summary || []);
      setByShopkeeper(shopkeeperRes.data.sales || []);
      setByProduct(productRes.data.sales || []);
      setByPayment(paymentRes.data.sales || []);
    } catch (err) {
      setError('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (data, headers, filename) => {
    const csvRows = [headers.join(',')];
    data.forEach(row => {
      csvRows.push(headers.map(h => row[h]).join(','));
    });
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Sales Reporting Dashboard</h1>
      <div className="mb-4 flex gap-4 items-center">
        <label className="font-medium">Period:</label>
        <select
          className="border rounded px-2 py-1"
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          {periods.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Sales Trend Chart */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Sales Trend</h2>
            <Line
              data={{
                labels: summary.map(s => s._id),
                datasets: [
                  {
                    label: 'Total Sales',
                    data: summary.map(s => s.totalSales),
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
            <button
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
              onClick={() => exportCSV(summary, ['_id', 'totalSales', 'count'], `sales-summary-${period}.csv`)}
            >
              Export CSV
            </button>
          </div>

          {/* By Shopkeeper */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Sales by Shopkeeper</h2>
            <Bar
              data={{
                labels: byShopkeeper.map(s => s.name),
                datasets: [
                  {
                    label: 'Total Sales',
                    data: byShopkeeper.map(s => s.totalSales),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
            <button
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs"
              onClick={() => exportCSV(byShopkeeper, ['name', 'email', 'totalSales', 'count'], 'sales-by-shopkeeper.csv')}
            >
              Export CSV
            </button>
          </div>

          {/* By Product */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Sales by Product</h2>
            <Bar
              data={{
                labels: byProduct.map(s => s.name),
                datasets: [
                  {
                    label: 'Total Sold',
                    data: byProduct.map(s => s.totalSold),
                    backgroundColor: 'rgba(251, 191, 36, 0.7)',
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
            <button
              className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-xs"
              onClick={() => exportCSV(byProduct, ['name', 'totalSold', 'totalSales'], 'sales-by-product.csv')}
            >
              Export CSV
            </button>
          </div>

          {/* By Payment Method */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Sales by Payment Method</h2>
            <Pie
              data={{
                labels: byPayment.map(s => s._id),
                datasets: [
                  {
                    label: 'Total Sales',
                    data: byPayment.map(s => s.totalSales),
                    backgroundColor: [
                      'rgba(37, 99, 235, 0.7)',
                      'rgba(16, 185, 129, 0.7)',
                      'rgba(251, 191, 36, 0.7)',
                      'rgba(239, 68, 68, 0.7)',
                    ],
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
            <button
              className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-xs"
              onClick={() => exportCSV(byPayment, ['_id', 'totalSales', 'count'], 'sales-by-payment-method.csv')}
            >
              Export CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSalesReport; 