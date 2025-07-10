import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  Cog6ToothIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { saveAs } from 'file-saver';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: [],
    topProducts: [],
    monthlyRevenue: [],
    orderStatusCounts: {},
    usersByMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const { user } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (tab === 'dashboard') fetchAnalytics();
    if (tab === 'users') fetchUsers();
    // Re-fetch analytics when timeRange changes
  }, [tab, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/analytics?timeRange=${timeRange}`);
      const monthlyRevenue = (res.data.salesByMonth || []).map(item => ({
        month: item._id,
        revenue: item.total || 0
      }));
      setStats({
        ...stats,
        totalOrders: res.data.totalOrders,
        totalProducts: res.data.totalProducts,
        totalUsers: res.data.totalUsers,
        totalRevenue: res.data.totalSales,
        monthlyRevenue,
        usersByMonth: res.data.usersByMonth
      });
    } catch (error) {
      // Use toast error handler
      if (typeof error === 'function') error('Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/users');
      setUsers(res.data.users);
    } catch (error) {
      error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyRevenue = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 10000) + 1000
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {changeType === 'up' ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change}% from last month
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  const filteredOrders = (stats.recentOrders || []).filter(order =>
    (currencyFilter === 'ALL' || order.currency === currencyFilter) &&
    (statusFilter === 'ALL' || order.status === statusFilter)
  );

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Total (Local)', 'Currency', 'Total (USD)', 'Status'];
    const rows = filteredOrders.map(order => [
      order._id,
      new Date(order.createdAt).toLocaleDateString(),
      order.userId?.name || '',
      order.localAmount || order.totalAmount,
      order.currency || 'USD',
      order.usdAmount || order.totalAmount,
      order.status
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `orders_${Date.now()}.csv`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tab.Group selectedIndex={tab === 'dashboard' ? 0 : 1} onChange={i => setTab(i === 0 ? 'dashboard' : 'users')}>
          <Tab.List className="flex space-x-4 mb-8">
            <Tab className={({ selected }) => selected ? 'px-4 py-2 bg-blue-600 text-white rounded' : 'px-4 py-2 bg-white text-blue-600 rounded border border-blue-600'}>Dashboard</Tab>
            <Tab className={({ selected }) => selected ? 'px-4 py-2 bg-blue-600 text-white rounded' : 'px-4 py-2 bg-white text-blue-600 rounded border border-blue-600'}>Users</Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                  <Link
                    to="/admin/products"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Product
                  </Link>
                  <Link
                    to="/admin/payment-settings"
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Payment Settings
                  </Link>
                  <Link
                    to="/admin/events"
                    className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                    Manage Events
                  </Link>
                  <Link
                    to="/admin/inventory-logs"
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Inventory Logs
                  </Link>
                  <Link
                    to="/admin/performance-dashboard"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Performance Dashboard
                  </Link>
                  <Link
                    to="/admin/adverts"
                    className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Manage Adverts
                  </Link>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-4">
                <select value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)} className="border rounded px-2 py-1">
                  <option value="ALL">All Currencies</option>
                  {[...new Set((stats.recentOrders || []).map(o => o.currency).filter(Boolean))].map(cur => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-2 py-1">
                  <option value="ALL">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">Export CSV</button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={ShoppingCartIcon}
                  change="12"
                  changeType="up"
                />
                <StatCard
                  title="Total Revenue"
                  value={`$${stats.totalRevenue.toFixed(2)}`}
                  icon={CurrencyDollarIcon}
                  change="8"
                  changeType="up"
                />
                <StatCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={Cog6ToothIcon}
                  change="5"
                  changeType="up"
                />
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={UserIcon}
                  change="15"
                  changeType="up"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                      <Link to="/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View All
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredOrders.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{order._id.slice(-6)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {order.userId.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {order.items.length} item(s)
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Alerts */}
                <div className="space-y-6">
                  {/* Low Stock Alert */}
                  {stats.lowStockProducts.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center mb-4">
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                      </div>
                      <div className="space-y-3">
                        {stats.lowStockProducts.slice(0, 3).map((product) => (
                          <div key={product._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{product.title}</p>
                              <p className="text-xs text-gray-600">{product.stock} items left</p>
                            </div>
                            <Link
                              to={`/admin/products/${product._id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                          </div>
                        ))}
                      </div>
                      {stats.lowStockProducts.length > 3 && (
                        <Link to="/admin/products" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 block">
                          View all ({stats.lowStockProducts.length})
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Top Products */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {stats.topProducts.map((product, index) => (
                        <div key={product._id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-10 h-10 rounded object-cover mr-3"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{product.title}</p>
                              <p className="text-xs text-gray-600">{product.sales} sales</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.orderStatusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status).replace('bg-', 'bg-').replace('text-', '')}`}></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">{status}</span>
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Revenue Chart */}
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
                <div className="flex items-end space-x-2 h-32">
                  {stats.monthlyRevenue.map((item, index) => {
                    const maxRevenue = Math.max(...stats.monthlyRevenue.map(r => r.revenue));
                    const height = (item.revenue / maxRevenue) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="text-xs text-gray-600 mt-2">{item.month}</span>
                        <span className="text-xs font-medium text-gray-900">${item.revenue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Sales by Currency</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(stats.recentOrders.reduce((acc, o) => {
                      if (!o.currency) return acc;
                      acc[o.currency] = (acc[o.currency] || 0) + (o.localAmount || o.totalAmount || 0);
                      return acc;
                    }, {})).map(([currency, total]) => ({ currency, total }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="currency" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#f59e42" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Sales Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#f59e42" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mb-8">
                {/* Order Status Pie Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Order Status Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={Object.entries(stats.orderStatusCounts).map(([status, value]) => ({ name: status, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#2563eb">
                        {Object.keys(stats.orderStatusCounts).map((status, idx) => (
                          <Cell key={status} fill={["#2563eb", "#10b981", "#f59e42", "#ef4444", "#a78bfa"][idx % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Top Products */}
                <div className="bg-white rounded-lg shadow p-6 col-span-2">
                  <h2 className="text-lg font-semibold mb-4">Top Products (by Sales)</h2>
                  <ul className="divide-y divide-gray-200">
                    {stats.topProducts.map(product => (
                      <li key={product._id} className="py-2 flex justify-between items-center">
                        <span>{product.title}</span>
                        <span className="font-semibold text-blue-600">{product.sales || 0} sales</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Users</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Created</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} className="border-b">
                        <td className="px-4 py-2">{user.name}</td>
                        <td className="px-4 py-2">{user.email}</td>
                        <td className="px-4 py-2">
                          <select
                            value={user.role}
                            onChange={async (e) => {
                              const newRole = e.target.value;
                              try {
                                await axios.put(`/users/${user._id}/role`, { role: newRole });
                                setUsers(users.map(u => u._id === user._id ? { ...u, role: newRole } : u));
                                success('Role updated');
                              } catch (error) {
                                error('Error updating role');
                              }
                            }}
                            className="border rounded px-2 py-1"
                            disabled={user._id === user.id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <button
                            className="text-red-600 hover:underline"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this user?')) {
                                try {
                                  await axios.delete(`/users/${user._id}`);
                                  setUsers(users.filter(u => u._id !== user._id));
                                  success('User deleted');
                                } catch (error) {
                                  error('Error deleting user');
                                }
                              }
                            }}
                            disabled={user._id === user.id}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdminDashboard; 