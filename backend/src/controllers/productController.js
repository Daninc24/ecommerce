const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');


// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    // Filter out products with missing images in production
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      const validProducts = products.filter(product => {
        if (!product.images || product.images.length === 0) return false;
        
        // Check if at least one image exists
        return product.images.some(imageUrl => {
          if (!imageUrl) return false;
          const filename = imageUrl.split('/').pop();
          const filePath = path.join(uploadsDir, filename);
          return fs.existsSync(filePath);
        });
      });
      
      res.json(validProducts);
    } else {
      res.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Migrate old product if needed
    let responseProduct = product;
    if (product.image && !product.images) {
      responseProduct = {
        ...product.toObject(),
        images: [product.image]
      };
    }
    
    res.json(responseProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create product (admin only)
const createProduct = async (req, res) => {
  try {
    console.log('=== CREATE PRODUCT START ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    // For multipart/form-data, fields come as strings in req.body
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const category = req.body.category;
    const stock = req.body.stock;
    
    console.log('Extracted fields:', { title, description, price, category, stock });
    
    // Validate required fields
    if (!title || !description || !price || !category || !stock) {
      return res.status(400).json({ 
        message: 'All fields are required',
        missing: {
          title: !title,
          description: !description,
          price: !price,
          category: !category,
          stock: !stock
        }
      });
    }
    
    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log('Processing uploaded files...');
      // Generate image URLs
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ecommerce-do0x.onrender.com'
        : `${req.protocol}://${req.get('host')}`;
      
      imageUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
      console.log('Generated URLs:', imageUrls);
    }
    console.log('Final image URLs:', imageUrls);

    // Validate that we have at least one image
    if (imageUrls.length === 0) {
      return res.status(400).json({ message: 'At least one product image is required' });
    }

    // Create product data with proper type conversion
    const productData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      images: imageUrls,
      category: category.trim(),
      stock: parseInt(stock)
    };

    console.log('Creating product with data:', productData);

    const product = new Product(productData);

    console.log('Product object created, saving to database...');
    await product.save();
    console.log('Product saved successfully:', product._id);
    
    res.status(201).json(product);
    console.log('=== CREATE PRODUCT SUCCESS ===');
  } catch (error) {
    console.error('=== CREATE PRODUCT ERROR ===');
    console.error('Error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;
    
    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // Generate image URLs with HTTPS in production
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ecommerce-do0x.onrender.com'
        : `${req.protocol}://${req.get('host')}`;
      imageUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
    }

    const updateData = { 
      title, 
      description, 
      price: parseFloat(price), 
      category, 
      stock: parseInt(stock) 
    };
    
    if (imageUrls.length > 0) {
      updateData.images = imageUrls;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const oldStock = product.stock;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log inventory change if stock changed
    if (typeof stock !== 'undefined' && parseInt(stock) !== oldStock) {
      await InventoryLog.create({
        product: product._id,
        user: req.user._id,
        change: parseInt(stock) - oldStock,
        reason: 'edit'
      });
    }

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBestSellingProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ salesCount: -1 }).limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getInventoryLogs = async (req, res) => {
  try {
    const { productId } = req.params;
    const logs = await InventoryLog.find(productId ? { product: productId } : {})
      .populate('user', 'name email role')
      .populate('product', 'title')
      .sort({ createdAt: -1 });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory logs', error: error.message });
  }
};

// Clean up products with missing images (admin only)
const cleanupMissingImages = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads');
    
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
        deletedCount: productsToDelete.length
      });
    } else {
      res.json({ message: 'No products with missing images found' });
    }
  } catch (error) {
    console.error('Error cleaning up products:', error);
    res.status(500).json({ message: 'Error cleaning up products', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getBestSellingProducts,
  getInventoryLogs,
  cleanupMissingImages
}; 