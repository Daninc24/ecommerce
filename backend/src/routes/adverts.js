const express = require('express');
const router = express.Router();
const advertController = require('../controllers/advertController');
const { auth, admin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Admin routes
router.post('/', auth, admin, upload.single('image'), advertController.createAdvert);
router.put('/:id', auth, admin, upload.single('image'), advertController.updateAdvert);
router.delete('/:id', auth, admin, advertController.deleteAdvert);
router.get('/all', auth, admin, advertController.listAdverts);

// Public route
router.get('/active', advertController.getActiveAdverts);

module.exports = router; 