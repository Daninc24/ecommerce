const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const Product = require('./models/Product');
const Message = require('./models/Message');

const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, orderLimiter, productLimiter, adminLimiter } = require('./middleware/rateLimiter');
const logger = require('./middleware/logger');
const requestId = require('./middleware/requestId');
const securityHeaders = require('./middleware/security');
const { uploadMultiple } = require('./middleware/upload');

dotenv.config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payment');
const usersRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const paymentCredentialRoutes = require('./routes/paymentCredential');
const eventRoutes = require('./routes/events');
const posRoutes = require('./routes/pos');
const customerRoutes = require('./routes/customers');
const couponRoutes = require('./routes/coupons');
const advertsRoutes = require('./routes/adverts');
const testimonialsRoutes = require('./routes/testimonials');

const { credentialCache, loadCredentials } = require('./utils/credentialCache');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5174',
      'https://myshoppingcenters-8knn.vercel.app',
      'https://myshoppingcenters.vercel.app',
      'https://myshoppingcenter.vercel.app',
      'https://ecommerceweb-gilt.vercel.app',
      'https://ecommerceweb.vercel.app',
      'https://ecommerceweb-git-main-daniel-mailus-projects.vercel.app'
    ],
    credentials: true,
  },
});

const onlineUsers = new Set();

// === SOCKET.IO ===
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.headers.cookie?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return next(new Error('Invalid user'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  socket.join(userId);
  onlineUsers.add(userId);
  io.emit('online_users', Array.from(onlineUsers));

  socket.on('send_message', async ({ receiver, content }) => {
    if (!receiver || !content) return;
    const message = await Message.create({ sender: userId, receiver, content });
    io.to(receiver).emit('new_message', message);
    io.to(userId).emit('new_message', message);
  });

  socket.on('typing', ({ to }) => {
    if (to) io.to(to).emit('typing', { from: userId, to });
  });

  socket.on('stop_typing', ({ to }) => {
    if (to) io.to(to).emit('stop_typing', { from: userId, to });
  });

  socket.on('get_online_users', () => {
    socket.emit('online_users', Array.from(onlineUsers));
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    io.emit('online_users', Array.from(onlineUsers));
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(securityHeaders);
}

app.use(requestId);
app.use(logger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://myshoppingcenters-8knn.vercel.app',
    'https://myshoppingcenters.vercel.app',
    'https://myshoppingcenter.vercel.app',
    'https://ecommerceweb-gilt.vercel.app',
    'https://ecommerceweb.vercel.app',
    'https://ecommerceweb-git-main-daniel-mailus-projects.vercel.app'
  ];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// === ROUTES ===
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment-credentials', paymentCredentialRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/adverts', advertsRoutes);
app.use('/api/testimonials', testimonialsRoutes);

// Serve uploaded files with CORS
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Very permissive CORS for images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving file:', err);
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// Serve profile images with CORS
app.get('/uploads/profiles/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/profiles', filename);
  
  // Very permissive CORS for images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving profile file:', err);
      res.status(404).json({ error: 'Profile file not found' });
    }
  });
});

app.get('/', (req, res) => {
  res.send('MyShopping Center API is running...');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requestId: req.id,
  });
});

app.post('/test-upload', uploadMultiple.array('images', 5), (req, res) => {
  try {
    if (req.files && req.files.length > 0) {
      // Generate image URLs with HTTPS in production
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ecommerce-do0x.onrender.com'
        : `${req.protocol}://${req.get('host')}`;
      const imageUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
      res.json({
        message: 'Upload test successful',
        files: req.files.map(f => f.filename),
        urls: imageUrls
      });
    } else {
      res.json({
        message: 'No files uploaded',
        files: []
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error in /api/test-products:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test-images', (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '../uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({ 
      message: 'Uploads directory contents',
      files: files.slice(0, 10), // Show first 10 files
      totalFiles: files.length
    });
  } catch (error) {
    res.json({ 
      message: 'Error reading uploads directory',
      error: error.message 
    });
  }
});

app.get('/api/list-images', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, '../uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => 
      file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    
    res.json({ 
      message: 'Uploads directory contents',
      totalFiles: files.length,
      imageFiles: imageFiles.slice(0, 20), // Show first 20 images
      totalImages: imageFiles.length
    });
  } catch (error) {
    res.json({ 
      message: 'Error reading uploads directory',
      error: error.message 
    });
  }
});

app.get('/api/cleanup-products', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    const products = await Product.find();
    const productsToDelete = [];
    
    products.forEach(product => {
      if (!product.images || product.images.length === 0) {
        productsToDelete.push(product._id);
        return;
      }
      
      // Check if all images are missing
      const allImagesMissing = product.images.every(imageUrl => {
        if (!imageUrl) return true;
        const filename = imageUrl.split('/').pop();
        const filePath = path.join(uploadsDir, filename);
        return !fs.existsSync(filePath);
      });
      
      if (allImagesMissing) {
        productsToDelete.push(product._id);
      }
    });
    
    if (productsToDelete.length > 0) {
      await Product.deleteMany({ _id: { $in: productsToDelete } });
      res.json({ 
        message: `Cleaned up ${productsToDelete.length} products with missing images`,
        deletedCount: productsToDelete.length,
        deletedIds: productsToDelete
      });
    } else {
      res.json({ message: 'No products with missing images found' });
    }
  } catch (error) {
    console.error('Error cleaning up products:', error);
    res.status(500).json({ message: 'Error cleaning up products', error: error.message });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestId: req.id,
  });
});

app.use(errorHandler);
app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles')));

app.use(passport.initialize());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// === START SERVER ===
(async () => {
  try {
    const PORT = process.env.PORT || 5000;
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myshoppingcenter';

    await mongoose.connect(MONGO_URI);

    console.log('✅ MongoDB connected');

    await loadCredentials(); // Load Stripe, PayPal, Mpesa, Google credentials

    passport.use(new GoogleStrategy({
      clientID: credentialCache.google.clientId,
      clientSecret: credentialCache.google.clientSecret,
      callbackURL: '/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-8)
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));

    server.listen(PORT, () => console.log(`🚀 Server (with Socket.IO) running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});


