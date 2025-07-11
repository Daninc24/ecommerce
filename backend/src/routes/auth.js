const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout, registerValidators, loginValidators } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', auth, getProfile);

module.exports = router; 