const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserProfile, changeUserPassword, updateUserRole, deleteUser, uploadProfileImage, sendMessage, getMessages, getAdminUser, getAllMessages, updateUserSalary } = require('../controllers/userController');
const { auth, admin } = require('../middleware/auth');

// Admin: List all users
router.get('/', auth, admin, getAllUsers);

// Self or admin: Get messages (move above parameterized routes)
router.get('/messages', auth, getMessages);

// Self or admin: Send message (move above parameterized routes)
router.post('/messages', auth, sendMessage);

// Self or admin: Get first admin user for messaging purposes (move above parameterized routes)
router.get('/admin-user', auth, getAdminUser);

// Self or admin: Get user profile
router.get('/:id', auth, getUserById);

// Self or admin: Update user profile
router.put('/:id', auth, updateUserProfile);

// Self or admin: Change user password
router.put('/:id/password', auth, changeUserPassword);

// Admin: Update user role
router.put('/:id/role', auth, admin, updateUserRole);

// Admin: Delete user
router.delete('/:id', auth, admin, deleteUser);

// Self or admin: Upload/update profile image
router.post('/:id/profile-image', auth, uploadProfileImage);

// Admin: Get all messages where admin is sender or receiver
router.get('/messages/all', auth, admin, getAllMessages);

// Admin or manager: Update user salary
router.put('/:id/salary', auth, updateUserSalary);

module.exports = router; 