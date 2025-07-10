const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myshoppingcenter';

const sampleProducts = [
  {
    title: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 99.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
    stock: 50
  },
  {
    title: 'Smartphone Case',
    description: 'Durable protective case for smartphones with shock absorption technology.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1603313011108-4f4c76b0b5c5?w=400',
    category: 'Accessories',
    stock: 100
  },
  {
    title: 'Coffee Maker',
    description: 'Programmable coffee maker with thermal carafe and auto-shutoff feature.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
    category: 'Home & Kitchen',
    stock: 25
  },
  {
    title: 'Running Shoes',
    description: 'Comfortable running shoes with breathable mesh and cushioned sole.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    category: 'Sports',
    stock: 30
  },
  {
    title: 'Laptop Stand',
    description: 'Adjustable aluminum laptop stand for better ergonomics and cooling.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
    category: 'Electronics',
    stock: 40
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products only (keep users)
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Create sample products
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
    }
    console.log('Created sample products');

    console.log('Database seeded successfully!');
    console.log('\nNote: No test accounts were created.');
    console.log('You can register your own accounts through the application.');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedData(); 