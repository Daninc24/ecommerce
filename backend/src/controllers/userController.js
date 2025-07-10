console.log('LOADED userController.js');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const io = require('../server').io || (global.io && global.io); // For Socket.IO access

const uploadDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Admin: List all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Self or admin: Get user profile
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(id, '-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Self or admin: Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { name, email } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    res.json({ message: 'Profile updated', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Self or admin: Change user password
exports.changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role !== 'admin') {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// Admin: Update user role
exports.updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin', 'shopkeeper', 'delivery', 'moderator', 'employee', 'store_manager', 'warehouse_manager', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = role;
    await user.save();
    res.json({ message: 'User role updated', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Multer setup for profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user._id}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

exports.uploadProfileImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
      await user.save();
      res.json({ profileImage: user.profileImage });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading profile image', error: error.message });
    }
  }
];

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user._id;
    if (!receiver || !content) return res.status(400).json({ message: 'Receiver and content required' });
    const message = await Message.create({ sender, receiver, content });
    console.log('Message saved:', message);
    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  console.log('=== ENTERED getMessages CONTROLLER ===');
  try {
    const userId = req.user._id.toString();
    const withUser = req.query.with?.toString();
    if (!withUser) return res.status(400).json({ message: 'Missing user to get conversation with' });

    const requester = req.user;
    const withUserObj = await User.findById(withUser);

    // Debug logging
    console.log('getMessages: requester:', requester);
    console.log('getMessages: withUser:', withUser);
    console.log('getMessages: withUserObj:', withUserObj);

    if (!withUserObj) {
      console.log('getMessages: withUserObj not found');
      return res.status(404).json({ message: 'User to get conversation with not found' });
    }

    if (requester.role === 'admin') {
      // Admin can fetch messages with any user
    } else if (withUserObj.role === 'admin') {
      // User can fetch messages with admin
    } else {
      console.log('getMessages: Forbidden - permission check failed');
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Mark all unread messages from withUser to userId as read
    await Message.updateMany({ sender: withUser, receiver: userId, read: false }, { $set: { read: true } });
    // Emit read receipt to sender (if online)
    if (io) {
      io.to(withUser).emit('messages_read', { from: userId, to: withUser });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: withUser },
        { sender: withUser, receiver: userId }
      ]
    }).sort({ timestamp: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Get the first admin user (for messaging)
exports.getAdminUser = async (req, res) => {
  try {
    const adminUser = await User.findOne({ role: 'admin' }, '-password');
    if (!adminUser) return res.status(404).json({ message: 'No admin user found' });
    res.json({ admin: adminUser });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin user', error: error.message });
  }
};

// Admin: Get all messages where admin is sender or receiver
exports.getAllMessages = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    }).sort({ timestamp: 1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all messages', error: error.message });
  }
};

// Admin or manager: Update user salary
exports.updateUserSalary = async (req, res) => {
  try {
    if (!['admin', 'store_manager', 'warehouse_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { id } = req.params;
    const { salary } = req.body;
    if (typeof salary !== 'number' || salary < 0) {
      return res.status(400).json({ message: 'Invalid salary' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.salary = salary;
    await user.save();
    res.json({ message: 'User salary updated', user: { id: user._id, name: user.name, email: user.email, role: user.role, salary: user.salary } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user salary', error: error.message });
  }
}; 