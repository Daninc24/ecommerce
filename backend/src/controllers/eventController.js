const Event = require('../models/Event');
let io;
const path = require('path');
// Allow setting io from server.js
exports.setIO = (ioInstance) => { io = ioInstance; };

// Get all events (optionally filter by upcoming/past)
exports.getEvents = async (req, res) => {
  try {
    const { upcoming } = req.query;
    let query = {};
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }
    const events = await Event.find(query).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
};

// Get a single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch event', error: err.message });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      // Generate image URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ecommerce-do0x.onrender.com'
        : `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }
    const event = new Event({
      ...req.body,
      image: imageUrl || req.body.image
    });
    await event.save();
    if (io) io.emit('event_created', event);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      // Generate image URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://ecommerce-do0x.onrender.com'
        : `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }
    const updateData = {
      ...req.body,
    };
    if (imageUrl) updateData.image = imageUrl;
    const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (io) io.emit('event_updated', event);
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (io) io.emit('event_deleted', event._id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
}; 