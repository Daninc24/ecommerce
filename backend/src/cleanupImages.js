const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Product model
const Product = require('./models/Product');

const cleanupImages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('Uploads directory does not exist');
      return;
    }

    // Get all products from database
    const products = await Product.find({});
    console.log(`Found ${products.length} products in database`);

    // Collect all image URLs from products
    const usedImages = new Set();
    products.forEach(product => {
      if (product.images && product.images.length > 0) {
        product.images.forEach(imageUrl => {
          if (imageUrl) {
            const filename = imageUrl.split('/').pop();
            usedImages.add(filename);
          }
        });
      }
    });

    console.log(`Found ${usedImages.size} used images in database`);

    // Get all files in uploads directory
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in uploads directory`);

    // Find unused files
    const unusedFiles = files.filter(file => !usedImages.has(file));
    console.log(`Found ${unusedFiles.length} unused files`);

    // Delete unused files
    let deletedCount = 0;
    unusedFiles.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted: ${file}`);
      } catch (error) {
        console.error(`Error deleting ${file}:`, error.message);
      }
    });

    console.log(`Successfully deleted ${deletedCount} unused files`);
    console.log(`Remaining files: ${files.length - deletedCount}`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupImages();
}

module.exports = cleanupImages; 