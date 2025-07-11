// Force Vercel redeploy - API URL fixes applied
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Messages from './pages/Messages';
import AdminPaymentSettings from './pages/AdminPaymentSettings';
import Footer from './components/Footer';
import Events from './pages/Events';
import AdminEvents from './pages/AdminEvents';
import POS from './pages/POS';
import AdminUsers from './pages/AdminUsers';
import AdminSalesReport from './pages/AdminSalesReport';
import AdminInventoryLogs from './pages/AdminInventoryLogs';
import AdminPerformanceDashboard from './pages/AdminPerformanceDashboard';
import AdminAdverts from './pages/AdminAdverts';
import AuthFix from './components/AuthFix';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <div className="min-h-screen bg-gray-50">
                <AuthFix />
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Protected Routes */}
                    <Route path="/cart" element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    } />
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/pos" element={
                      <ProtectedRoute requiredRole={["admin", "employee", "shopkeeper", "delivery", "moderator", "store_manager", "warehouse_manager", "manager"]}>
                        <POS />
                      </ProtectedRoute>
                    } />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                    <Route path="/admin/products" element={
                      <AdminRoute>
                        <AdminProducts />
                      </AdminRoute>
                    } />
                    <Route path="/admin/orders" element={
                      <AdminRoute>
                        <AdminOrders />
                      </AdminRoute>
                    } />
                    <Route path="/admin/payment-settings" element={
                      <AdminRoute>
                        <AdminPaymentSettings />
                      </AdminRoute>
                    } />
                    <Route path="/admin/events" element={
                      <AdminRoute>
                        <AdminEvents />
                      </AdminRoute>
                    } />
                    <Route path="/admin/users" element={
                      <AdminRoute>
                        <AdminUsers />
                      </AdminRoute>
                    } />
                    <Route path="/admin/sales-report" element={
                      <AdminRoute>
                        <AdminSalesReport />
                      </AdminRoute>
                    } />
                    <Route path="/admin/inventory-logs" element={
                      <AdminRoute>
                        <AdminInventoryLogs />
                      </AdminRoute>
                    } />
                    <Route path="/admin/performance-dashboard" element={
                      <AdminRoute>
                        <AdminPerformanceDashboard />
                      </AdminRoute>
                    } />
                    <Route path="/admin/adverts" element={
                      <AdminRoute>
                        <AdminAdverts />
                      </AdminRoute>
                    } />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/events" element={<Events />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
