const Advert = require('../models/Advert');
const Product = require('../models/Product');

// Admin: Create advert
exports.createAdvert = async (req, res) => {
  try {
    const { title, message, product, startDate, endDate, active, template } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    const advert = await Advert.create({ title, message, product, image, startDate, endDate, active, template });
    res.status(201).json({ advert });
  } catch (error) {
    res.status(500).json({ message: 'Error creating advert', error: error.message });
  }
};

// Admin: Update advert
exports.updateAdvert = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, product, startDate, endDate, active, template } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    const advert = await Advert.findByIdAndUpdate(id, { title, message, product, image, startDate, endDate, active, template }, { new: true });
    if (!advert) return res.status(404).json({ message: 'Advert not found' });
    res.json({ advert });
  } catch (error) {
    res.status(500).json({ message: 'Error updating advert', error: error.message });
  }
};

// Admin: Delete advert
exports.deleteAdvert = async (req, res) => {
  try {
    const { id } = req.params;
    const advert = await Advert.findByIdAndDelete(id);
    if (!advert) return res.status(404).json({ message: 'Advert not found' });
    res.json({ message: 'Advert deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting advert', error: error.message });
  }
};

// Admin: List all adverts
exports.listAdverts = async (req, res) => {
  try {
    const adverts = await Advert.find().populate('product');
    res.json({ adverts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching adverts', error: error.message });
  }
};

// Public: Get active adverts
exports.getActiveAdverts = async (req, res) => {
  try {
    const now = new Date();
    const adverts = await Advert.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('product');
    res.json({ adverts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active adverts', error: error.message });
  }
}; 