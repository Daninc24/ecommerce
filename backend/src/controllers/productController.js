const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');


// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    // Migrate old products that have 'image' field instead of 'images'
    const migratedProducts = products.map(product => {
      if (product.image && !product.images) {
        // This is an old product with single image
        return {
          ...product.toObject(),
          images: [product.image]
        };
      }
      return product;
    });
    
    res.json(migratedProducts);
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
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrls = req.files.map(file => {
        const url = `${baseUrl}/uploads/${file.filename}`;
        console.log('Generated URL:', url);
        return url;
      });
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
      const baseUrl = `${req.protocol}://${req.get('host')}`;
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

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getBestSellingProducts,
  getInventoryLogs
}; 