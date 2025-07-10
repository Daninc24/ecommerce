const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, admin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Public: List and get events
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);

// Admin: Create, update, delete events
router.post('/', auth, admin, upload.single('image'), eventController.createEvent);
router.put('/:id', auth, admin, upload.single('image'), eventController.updateEvent);
router.delete('/:id', auth, admin, eventController.deleteEvent);

module.exports = router; 