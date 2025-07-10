import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile', label: 'Mobile' },
];

const POS = () => {
  const { user, loading: authLoading, isWarehouseManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalProduct, setModalProduct] = useState(null);
  const [barcodeScan, setBarcodeScan] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const receiptRef = useRef();
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [customerError, setCustomerError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [returnModal, setReturnModal] = useState(false);
  const [returnSaleId, setReturnSaleId] = useState('');
  const [returnSale, setReturnSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnError, setReturnError] = useState('');
  const [returnReceipt, setReturnReceipt] = useState(null);
  const [zReportModal, setZReportModal] = useState(false);
  const [zReport, setZReport] = useState(null);
  const [zReportLoading, setZReportLoading] = useState(false);
  const [zReportError, setZReportError] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleMsg, setRoleMsg] = useState('');
  // Add Product Modal State (for warehouse manager)
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductForm, setAddProductForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    stock: ''
  });
  const [addProductImages, setAddProductImages] = useState([]);
  const [addProductPreviews, setAddProductPreviews] = useState([]);
  const [addProductError, setAddProductError] = useState('');
  const [addProductLoading, setAddProductLoading] = useState(false);

  const categories = [
    { id: 'Electronics', name: 'Electronics' },
    { id: 'Computers & Laptops', name: 'Computers & Laptops' },
    { id: 'Mobile Phones', name: 'Mobile Phones' },
    { id: 'Accessories', name: 'Accessories' },
    { id: 'Home & Kitchen', name: 'Home & Kitchen' },
    { id: 'Sports', name: 'Sports' },
    { id: 'Fashion', name: 'Fashion' },
    { id: 'Beauty', name: 'Beauty & Personal Care' },
    { id: 'Toys', name: 'Toys & Games' },
    { id: 'Books', name: 'Books' },
    { id: 'Automotive', name: 'Automotive' },
    { id: 'Groceries', name: 'Groceries' },
    { id: 'Health', name: 'Health & Wellness' },
    { id: 'Office', name: 'Office Supplies' },
    { id: 'Garden', name: 'Garden & Outdoors' },
    { id: 'Pets', name: 'Pet Supplies' },
    { id: 'Baby', name: 'Baby & Kids' },
    { id: 'Music', name: 'Music & Instruments' },
    { id: 'Art', name: 'Art & Craft' },
    { id: 'Jewelry', name: 'Jewelry' },
    { id: 'Shoes', name: 'Shoes' },
    { id: 'Bags', name: 'Bags & Luggage' },
    { id: 'Watches', name: 'Watches' },
    { id: 'Phones', name: 'Phones & Tablets' },
    { id: 'Cameras', name: 'Cameras & Photography' },
    { id: 'Gaming', name: 'Gaming' },
    { id: 'Stationery', name: 'Stationery' },
    { id: 'Food', name: 'Food & Beverages' },
    { id: 'Tools', name: 'Tools & Hardware' },
    { id: 'Travel', name: 'Travel' },
    { id: 'Fitness', name: 'Fitness & Exercise' }
  ];

  useEffect(() => {
    if (user && user.role === 'admin') {
      setUsersLoading(true);
      axios.get('/users')
        .then(res => setAllUsers(res.data.users || []))
        .catch(() => setAllUsers([]))
        .finally(() => setUsersLoading(false));
    }
  }, [user]);

  useEffect(() => {
    // Fetch products
    axios.get('/products')
      .then(res => setProducts(res.data.products || res.data || []))
      .catch(() => setProducts([]));
  }, []);

  const filteredProducts = products.filter(p =>
    (p.title || p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product === product._id);
      if (existing) {
        if (existing.quantity < (product.stock || 0)) {
          return prev.map(item =>
            item.product === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return prev;
        }
      }
      return [...prev, { product: product._id, name: product.title || product.name, price: product.price, quantity: 1, stock: product.stock, image: (product.images && product.images[0]) || '' }];
    });
  };

  const updateQuantity = (productId, qty) => {
    setCart(prev =>
      prev.map(item =>
        item.product === productId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product !== productId));
  };

  // Add item-level discounts to cart items
  const setItemDiscount = (productId, type, value) => {
    setCart(prev => prev.map(item =>
      item.product === productId
        ? { ...item, discountType: type, discountValue: value }
        : item
    ));
  };

  // Modularize: move cart calculations to a helper function
  const getCartWithDiscounts = (cart) => cart.map(item => {
    let discount = 0;
    if (item.discountType === 'percent') {
      discount = Math.round((item.discountValue / 100) * item.price * item.quantity);
    } else if (item.discountType === 'fixed') {
      discount = Math.min(item.discountValue * item.quantity, item.price * item.quantity);
    }
    const subtotal = Math.max(0, item.price * item.quantity - discount);
    return { ...item, discount, subtotal };
  });

  const cartWithDiscounts = getCartWithDiscounts(cart);

  // Calculate total and total discount
  const total = cartWithDiscounts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemDiscountTotal = cartWithDiscounts.reduce((sum, item) => sum + (item.discount || 0), 0);

  // Search customers
  const searchCustomers = async (q) => {
    setCustomerError('');
    try {
      const res = await axios.get(`/customers/search?q=${encodeURIComponent(q)}`);
      setCustomerResults(res.data.customers || []);
    } catch {
      setCustomerResults([]);
    }
  };

  // Add new customer
  const handleAddCustomer = async () => {
    setCustomerError('');
    if (!newCustomer.name || !newCustomer.phone) {
      setCustomerError('Name and phone are required');
      return;
    }
    try {
      const res = await axios.post('/customers', newCustomer);
      setSelectedCustomer(res.data.customer);
      setCustomerModal(false);
      setNewCustomer({ name: '', phone: '', email: '' });
    } catch (err) {
      setCustomerError(err.response?.data?.message || 'Failed to add customer');
    }
  };

  // Validate and apply coupon
  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      const res = await axios.post('/coupons/validate', { code: couponCode });
      setAppliedCoupon(res.data.coupon);
      setCouponError('');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    }
  };

  // Calculate discount
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      couponDiscount = Math.round((appliedCoupon.value / 100) * (total - itemDiscountTotal));
    } else if (appliedCoupon.type === 'fixed') {
      couponDiscount = Math.min(appliedCoupon.value, total - itemDiscountTotal);
    }
  }
  const totalAfterDiscount = Math.max(0, total - itemDiscountTotal - couponDiscount);

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer before checkout.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/pos/sales', {
        items: cartWithDiscounts.map(item => ({
          product: item.product,
          quantity: item.quantity,
          discountType: item.discountType,
          discountValue: item.discountValue,
        })),
        total,
        paymentMethod,
        customer: selectedCustomer._id,
        coupon: appliedCoupon ? appliedCoupon.code : undefined,
        discount: itemDiscountTotal + couponDiscount,
        totalAfterDiscount,
      });
      setReceipt(res.data.sale);
      setCart([]);
      setSelectedCustomer(null);
      setAppliedCoupon(null);
      setCouponCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  // Add product to cart by barcode/sku
  const addByBarcode = (barcode) => {
    setBarcodeScan(barcode);
    const found = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (found) {
      addToCart(found);
      setError('');
    } else {
      setError('Product not found for barcode: ' + barcode);
    }
  };

  // Print receipt (browser print)
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: 'POS Receipt',
  });

  // Download receipt as PDF
  const handleDownloadPDF = () => {
    if (!receipt) return;
    const doc = new jsPDF();
    doc.text('Receipt', 14, 14);
    doc.text(`Sale ID: ${receipt._id}`, 14, 22);
    doc.text(`Date: ${new Date(receipt.createdAt).toLocaleString()}`, 14, 30);
    doc.text(`Payment: ${receipt.paymentMethod}`, 14, 38);
    doc.autoTable({
      startY: 44,
      head: [['Product', 'Qty', 'Price', 'Subtotal']],
      body: receipt.items.map(item => [item.name, item.quantity, item.price, item.subtotal]),
    });
    doc.text(`Total: ${receipt.total}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save('receipt.pdf');
  };

  // Fetch sale for return
  const fetchReturnSale = async () => {
    setReturnError('');
    setReturnSale(null);
    setReturnItems([]);
    if (!returnSaleId) return;
    try {
      const res = await axios.get(`/api/pos/sales/${returnSaleId}`);
      setReturnSale(res.data.sale);
      setReturnItems(res.data.sale.items.map(item => ({ ...item, returnQty: 0 })));
    } catch (err) {
      setReturnError('Sale not found');
    }
  };

  // Handle return quantity change
  const setReturnQty = (productId, qty) => {
    setReturnItems(prev => prev.map(item =>
      item.product === productId ? { ...item, returnQty: Math.max(0, Math.min(qty, Math.abs(item.quantity))) } : item
    ));
  };

  // Process return
  const handleProcessReturn = async () => {
    setReturnError('');
    const itemsToReturn = returnItems.filter(item => item.returnQty > 0).map(item => ({ product: item.product, quantity: item.returnQty }));
    if (itemsToReturn.length === 0) {
      setReturnError('Select at least one item to return');
      return;
    }
    try {
      const res = await axios.post('/api/pos/sales/return', {
        saleId: returnSale._id,
        items: itemsToReturn,
        reason: 'Customer return',
      });
      setReturnReceipt(res.data.returnSale);
      setReturnModal(false);
      setReturnSaleId('');
      setReturnSale(null);
      setReturnItems([]);
    } catch (err) {
      setReturnError(err.response?.data?.message || 'Return failed');
    }
  };

  const fetchZReport = async () => {
    setZReportLoading(true);
    setZReportError('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await axios.get('/api/pos/z-report', { params: { date: today } });
      setZReport(res.data);
    } catch (err) {
      setZReportError('Failed to fetch Z-report');
    } finally {
      setZReportLoading(false);
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    setRoleMsg('');
    try {
      await axios.put(`/users/${userId}/role`, { role: newRole });
      setRoleMsg('Role updated successfully!');
      // Refresh users
      const res = await axios.get('/users');
      setAllUsers(res.data.users || []);
    } catch (err) {
      setRoleMsg('Failed to update role: ' + (err.response?.data?.message || err.message));
    }
  };

  const canSetSalary = user && (user.role === 'admin' || user.role === 'manager');
  const handleUserSalaryChange = async (userId, salary) => {
    setRoleMsg('');
    if (isNaN(salary) || salary < 0) {
      setRoleMsg('Invalid salary amount');
      return;
    }
    try {
      await axios.put(`/users/${userId}/salary`, { salary: Number(salary) });
      setRoleMsg('Salary updated successfully!');
      // Refresh users
      const res = await axios.get('/users');
      setAllUsers(res.data.users || []);
    } catch (err) {
      setRoleMsg('Failed to update salary: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddProductImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setAddProductError('Maximum 5 images allowed');
      return;
    }
    setAddProductImages(files);
    setAddProductPreviews(files.map(file => URL.createObjectURL(file)));
  };

  const removeAddProductImage = (index) => {
    setAddProductImages(prev => prev.filter((_, i) => i !== index));
    setAddProductPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    setAddProductError('');
    if (addProductImages.length === 0) {
      setAddProductError('Please upload at least one image for the product');
      return;
    }
    setAddProductLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', addProductForm.title);
      submitData.append('description', addProductForm.description);
      submitData.append('price', addProductForm.price);
      submitData.append('category', addProductForm.category);
      submitData.append('stock', addProductForm.stock);
      addProductImages.forEach(file => submitData.append('images', file));
      await axios.post('/products', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAddProduct(false);
      setAddProductForm({ title: '', description: '', price: '', category: '', stock: '' });
      setAddProductImages([]);
      setAddProductPreviews([]);
      setAddProductError('');
      // Refresh products
      axios.get('/products')
        .then(res => setProducts(res.data.products || res.data || []));
    } catch (error) {
      setAddProductError(error.response?.data?.message || error.message || 'Failed to add product');
    } finally {
      setAddProductLoading(false);
    }
  };

  if (receipt) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
        <div ref={receiptRef} className="print:bg-white">
          <h2 className="text-xl font-bold mb-4">Receipt</h2>
          <div className="mb-2">Sale ID: {receipt._id}</div>
          <div className="mb-2">Date: {new Date(receipt.createdAt).toLocaleString()}</div>
          <div className="mb-2">Payment: {receipt.paymentMethod}</div>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr>
                <th className="text-left">Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{item.price}</td>
                  <td className="text-right">{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="font-bold text-right">Total: {receipt.total}</div>
          {appliedCoupon && (
            <div className="mb-2 text-green-700">Coupon: {appliedCoupon.code} ({appliedCoupon.type === 'percent' ? `${appliedCoupon.value}%` : `Ksh ${appliedCoupon.value}`})</div>
          )}
          {(itemDiscountTotal + couponDiscount) > 0 && <div className="mb-2 text-green-700">Total Discount: -Ksh {itemDiscountTotal + couponDiscount}</div>}
          <div className="font-bold text-right">Grand Total: {totalAfterDiscount}</div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handlePrint}>
            Print Receipt
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleDownloadPDF}>
            Download PDF
          </button>
          <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setReceipt(null)}>
            New Sale
          </button>
        </div>
      </div>
    );
  }

  if (returnReceipt) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
        <h2 className="text-xl font-bold mb-4 text-red-700">Return Receipt</h2>
        <div className="mb-2">Return ID: {returnReceipt._id}</div>
        <div className="mb-2">Original Sale: {returnReceipt.originalSale}</div>
        <div className="mb-2">Date: {new Date(returnReceipt.createdAt).toLocaleString()}</div>
        <div className="mb-2">Payment: {returnReceipt.paymentMethod}</div>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty Returned</th>
              <th>Price</th>
              <th>Refund</th>
            </tr>
          </thead>
          <tbody>
            {returnReceipt.items.map((item, i) => (
              <tr key={i}>
                <td>{item.name}</td>
                <td className="text-center">{Math.abs(item.quantity)}</td>
                <td className="text-right">{item.price}</td>
                <td className="text-right">{Math.abs(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="font-bold text-right text-red-700">Total Refund: Ksh {Math.abs(returnReceipt.total)}</div>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setReturnReceipt(null)}>
          New Return
        </button>
      </div>
    );
  }

  if (zReportModal) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl" onClick={() => setZReportModal(false)}>&times;</button>
        <h2 className="text-lg font-bold mb-4">Z-Report (Daily Sales Summary)</h2>
        {zReportLoading ? (
          <div>Loading...</div>
        ) : zReportError ? (
          <div className="text-red-500">{zReportError}</div>
        ) : zReport ? (
          <div>
            <div className="mb-2">Date: {zReport.date}</div>
            <div className="mb-2">Total Sales: <span className="font-bold">Ksh {zReport.totalSales}</span></div>
            <div className="mb-2">Total Returns: <span className="font-bold">Ksh {zReport.totalReturns}</span></div>
            <div className="mb-2">Net Sales: <span className="font-bold">Ksh {zReport.netSales}</span></div>
            <div className="mb-2">Sales Count: {zReport.salesCount}</div>
            <div className="mb-2">Returns Count: {zReport.returnsCount}</div>
            <div className="mb-2">Payment Breakdown:</div>
            <ul className="mb-2">
              {Object.entries(zReport.paymentBreakdown).map(([method, amount]) => (
                <li key={method}>{method}: Ksh {amount}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}


  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6 bg-white rounded shadow mt-4 sm:mt-8">
      
      {/* <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
        <strong>Debug:</strong> User: {user ? user.name : 'None'} | Role: {user ? user.role : 'None'}
      </div>
      <div className="mb-2 p-2 bg-blue-100 text-blue-800 rounded text-xs">
        <strong>Possible Roles:</strong> user, admin, shopkeeper, delivery, moderator, employee, store_manager, warehouse_manager, manager<br />
        <strong>Current Role:</strong> {user ? user.role : 'None'}
      </div> */}
      {/* Returns/Refunds Modal */}
      {returnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl" onClick={() => setReturnModal(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-4">Process Return/Refund</h2>
            <div className="mb-2 flex gap-2 items-center">
              <input
                type="text"
                className="border rounded px-2 py-1 w-full"
                placeholder="Enter Sale ID"
                value={returnSaleId}
                onChange={e => setReturnSaleId(e.target.value)}
              />
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={fetchReturnSale}>Search</button>
            </div>
            {returnError && <div className="text-red-500 mb-2">{returnError}</div>}
            {returnSale && (
              <div>
                <div className="mb-2">Sale ID: {returnSale._id}</div>
                <div className="mb-2">Date: {new Date(returnSale.createdAt).toLocaleString()}</div>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sold Qty</th>
                      <th>Return Qty</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map(item => (
                      <tr key={item.product}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={Math.abs(item.quantity)}
                            value={item.returnQty}
                            onChange={e => setReturnQty(item.product, parseInt(e.target.value) || 0)}
                            className="w-16 border rounded px-2 py-1 text-center"
                          />
                        </td>
                        <td className="text-right">{item.price}</td>
                        <td className="text-right">{item.price * item.returnQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleProcessReturn}>Process Return</button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Customer Modal */}
      {customerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl" onClick={() => setCustomerModal(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-4">Select or Add Customer</h2>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full mb-2"
              placeholder="Search by name, phone, or email"
              value={customerSearch}
              onChange={e => {
                setCustomerSearch(e.target.value);
                searchCustomers(e.target.value);
              }}
            />
            <div className="max-h-40 overflow-y-auto mb-2">
              {customerResults.map(c => (
                <div key={c._id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.phone} {c.email && <>| {c.email}</>}</div>
                  </div>
                  <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={() => { setSelectedCustomer(c); setCustomerModal(false); }}>Select</button>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold mb-2">Add New Customer</h3>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full mb-2"
                placeholder="Name"
                value={newCustomer.name}
                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
              <input
                type="text"
                className="border rounded px-2 py-1 w-full mb-2"
                placeholder="Phone"
                value={newCustomer.phone}
                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
              <input
                type="email"
                className="border rounded px-2 py-1 w-full mb-2"
                placeholder="Email (optional)"
                value={newCustomer.email}
                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
              <button className="px-4 py-2 bg-green-600 text-white rounded w-full" onClick={handleAddCustomer}>Add Customer</button>
              {customerError && <div className="text-red-500 mt-2">{customerError}</div>}
            </div>
          </div>
        </div>
      )}
      {/* Barcode Scanner Controls */}
      <div className="mb-4 flex gap-4 items-center">
        <button
          className="px-3 py-2 bg-gray-700 text-white rounded"
          onClick={() => setShowScanner(s => !s)}
        >
          {showScanner ? 'Close Scanner' : 'Scan Barcode (Webcam)'}
        </button>
        <span className="text-xs text-gray-500">or use USB barcode scanner and scan into the field below</span>
        <input
          type="text"
          className="border rounded px-2 py-1 text-sm"
          placeholder="Scan barcode here..."
          value={barcodeScan}
          onChange={e => setBarcodeScan(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && barcodeScan) {
              addByBarcode(barcodeScan);
              setBarcodeScan('');
            }
          }}
        />
      </div>
      {/* Webcam Barcode Scanner */}
      {showScanner && (
        <div className="mb-4">
          <BarcodeScannerComponent
            width={400}
            height={200}
            onUpdate={(err, result) => {
              if (result) {
                addByBarcode(result.text);
                setShowScanner(false);
              }
            }}
          />
        </div>
      )}
      {/* Product Details Modal */}
      {modalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-0">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl" onClick={() => setModalProduct(null)}>&times;</button>
            <div className="flex flex-col items-center">
              {modalProduct.images && modalProduct.images.length > 0 && (
                <img src={modalProduct.images[0]} alt={modalProduct.title || modalProduct.name} className="w-40 h-40 object-cover rounded mb-4" />
              )}
              <h2 className="text-xl font-bold mb-2">{modalProduct.title || modalProduct.name}</h2>
              <div className="text-gray-600 mb-2">Ksh {modalProduct.price}</div>
              <div className="text-xs text-gray-500 mb-2">Stock: {modalProduct.stock} | Category: {modalProduct.category}</div>
              <div className="mb-4 text-gray-700 text-sm">{modalProduct.description}</div>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={() => { addToCart(modalProduct); setModalProduct(null); }}
                disabled={modalProduct.stock === 0}
              >
                {modalProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
        <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={() => setReturnModal(true)}>
          Returns/Refunds
        </button>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setCustomerModal(true)}>
          {selectedCustomer ? 'Change Customer' : 'Select/Add Customer'}
        </button>
        <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => { setZReportModal(true); fetchZReport(); }}>
          Z-Report (Daily Summary)
        </button>
        {selectedCustomer && (
          <div className="ml-2 p-2 bg-gray-100 rounded">
            <span className="font-medium">Customer:</span> {selectedCustomer.name} ({selectedCustomer.phone})
          </div>
        )}
      </div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h2 className="font-semibold mb-2">Products</h2>
          <div className="h-96 overflow-y-auto border rounded p-2 bg-gray-50">
            {filteredProducts.length === 0 && <div className="text-gray-400">No products found.</div>}
            {filteredProducts.map(product => (
              <div key={product._id} className="flex justify-between items-center py-2 border-b last:border-b-0 gap-2 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => setModalProduct(product)}
              >
                <div className="flex items-center gap-2">
                  {product.images && product.images[0] && (
                    <img src={product.images[0]} alt={product.title || product.name} className="w-12 h-12 object-cover rounded" />
                  )}
                  <div>
                    <div className="font-medium">{product.title || product.name}</div>
                    <div className="text-xs text-gray-500">Ksh {product.price} | Stock: {product.stock}</div>
                    <div className="text-xs text-gray-400">{product.category}</div>
                  </div>
                </div>
                <button
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50"
                  onClick={e => { e.stopPropagation(); addToCart(product); }}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Cart</h2>
          <div className="h-96 overflow-y-auto border rounded p-2 bg-gray-50">
            {cartWithDiscounts.length === 0 && <div className="text-gray-400">Cart is empty.</div>}
            {cartWithDiscounts.map(item => (
              <div key={item.product} className="flex items-center justify-between py-2 border-b last:border-b-0 gap-2">
                <div className="flex items-center gap-2">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                  )}
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">Ksh {item.price} | Stock: {item.stock}</div>
                    <div className="text-xs text-gray-400">Subtotal: Ksh {item.subtotal}</div>
                    {item.discount > 0 && (
                      <div className="text-xs text-green-700">Item Discount: -Ksh {item.discount}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={e => updateQuantity(item.product, Math.min(item.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 border rounded px-2 py-1 text-center"
                    />
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                      onClick={() => removeFromCart(item.product)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      className="border rounded px-1 py-0.5 text-xs"
                      value={item.discountType || ''}
                      onChange={e => setItemDiscount(item.product, e.target.value, item.discountValue || 0)}
                    >
                      <option value="">No Discount</option>
                      <option value="percent">% Off</option>
                      <option value="fixed">Ksh Off</option>
                    </select>
                    {item.discountType && (
                      <input
                        type="number"
                        min="0"
                        max={item.discountType === 'percent' ? 100 : item.price}
                        value={item.discountValue || ''}
                        onChange={e => setItemDiscount(item.product, item.discountType, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 border rounded px-1 py-0.5 text-xs"
                        placeholder={item.discountType === 'percent' ? '% Off' : 'Ksh Off'}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between items-center">
            <div className="font-bold">Total: Ksh {total}</div>
            {itemDiscountTotal > 0 && <div className="font-bold text-green-700">Item Discounts: -Ksh {itemDiscountTotal}</div>}
            {appliedCoupon && <div className="font-bold text-green-700">Coupon: {appliedCoupon.code} ({appliedCoupon.type === 'percent' ? `${appliedCoupon.value}%` : `Ksh ${appliedCoupon.value}`})</div>}
            {(itemDiscountTotal + couponDiscount) > 0 && <div className="font-bold text-green-700">Total Discount: -Ksh {itemDiscountTotal + couponDiscount}</div>}
            <div className="font-bold">Grand Total: Ksh {totalAfterDiscount}</div>
            <select
              className="border rounded px-2 py-1"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
            >
              {paymentMethods.map(pm => (
                <option key={pm.value} value={pm.value}>{pm.label}</option>
              ))}
            </select>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleCheckout}
              disabled={cartWithDiscounts.length === 0 || loading}
            >
              {loading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      </div>
      {user && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
          <div className="font-bold mb-2 text-green-900">{user.role === 'admin' ? 'Assign Roles and Salaries to Users' : user.role === 'manager' ? 'Set User Salaries' : 'User Salaries'}</div>
          {roleMsg && <div className="mb-2 text-green-700">{roleMsg}</div>}
          {usersLoading ? (
            <div>Loading users...</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-[600px] w-full text-xs border rounded">
                <thead>
                  <tr className="bg-green-100 text-left">
                    <th className="p-2">Name</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    {user.role === 'admin' && <th>Assign Role</th>}
                    <th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u._id} className="border-t">
                      <td className="p-2">{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      {user.role === 'admin' && (
                        <td>
                          <select
                            value={u.role}
                            onChange={e => handleUserRoleChange(u._id, e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                            disabled={u._id === user._id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="shopkeeper">Shopkeeper</option>
                            <option value="delivery">Delivery</option>
                            <option value="moderator">Moderator</option>
                            <option value="employee">Employee</option>
                            <option value="store_manager">Store Manager</option>
                            <option value="warehouse_manager">Warehouse Manager</option>
                            <option value="manager">Manager</option>
                          </select>
                        </td>
                      )}
                      <td>
                        {(user.role === 'admin' || user.role === 'manager') ? (
                          <input
                            type="number"
                            min="0"
                            value={u.salary || ''}
                            onChange={e => handleUserSalaryChange(u._id, e.target.value)}
                            className="border rounded px-2 py-1 w-20 text-xs"
                            disabled={u._id === user._id}
                          />
                        ) : (
                          <span>Ksh {u.salary || 0}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                    <tr><td colSpan={user.role === 'admin' ? 5 : 4} className="text-center py-2 text-gray-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* Add Product Button for Warehouse Manager */}
      {isWarehouseManager && (
        <div className="mb-4 flex justify-end">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={() => setShowAddProduct(true)}
          >
            <PlusIcon className="h-5 w-5" />
            Add Product
          </button>
        </div>
      )}
      {/* Add Product Modal for Warehouse Manager */}
      {isWarehouseManager && showAddProduct && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-blue-900">Add New Product (Warehouse Manager)</span>
            <button className="text-blue-600 hover:text-red-600" onClick={() => setShowAddProduct(false)}>&times;</button>
          </div>
          <form onSubmit={handleAddProductSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input type="text" required value={addProductForm.title} onChange={e => setAddProductForm(f => ({ ...f, title: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select required value={addProductForm.category} onChange={e => setAddProductForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                  <option value="">Select a category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input type="number" step="0.01" required value={addProductForm.price} onChange={e => setAddProductForm(f => ({ ...f, price: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                <input type="number" required value={addProductForm.stock} onChange={e => setAddProductForm(f => ({ ...f, stock: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (Max 5)</label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="file-upload-area">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each (Max 5 images)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleAddProductImageChange} />
                  </label>
                </div>
                {addProductPreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {addProductPreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img src={preview} alt={`Preview ${index + 1}`} className="image-preview w-full h-32" />
                          <button type="button" onClick={() => removeAddProductImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"><XMarkIcon className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea required rows="3" value={addProductForm.description} onChange={e => setAddProductForm(f => ({ ...f, description: e.target.value }))} className="input-field" />
            </div>
            {addProductError && <div className="text-red-600 text-sm">{addProductError}</div>}
            <div className="flex space-x-4">
              <button type="submit" className="btn-primary" disabled={addProductLoading}>{addProductLoading ? 'Adding...' : 'Add Product'}</button>
              <button type="button" onClick={() => setShowAddProduct(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default POS; 