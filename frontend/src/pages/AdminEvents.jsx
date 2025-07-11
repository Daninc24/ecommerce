import React, { useEffect, useState } from 'react';
import axios from 'axios';

const emptyEvent = {
  title: '',
  description: '',
  date: '',
  link: '',
  image: '',
};

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/events');
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('date', form.date);
      data.append('link', form.link);
      if (imageFile) data.append('image', imageFile);
      else if (form.image) data.append('image', form.image);
      let res;
      if (editingId) {
        res = await axios.put(`/api/events/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Event updated!');
      } else {
        res = await axios.post('/api/events', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Event created!');
      }
      setForm(emptyEvent);
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      fetchEvents();
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = event => {
    setForm({
      ...event,
      date: event.date ? event.date.slice(0, 16) : '',
    });
    setEditingId(event._id);
    setImageFile(null);
    setImagePreview(event.image || '');
    setMsg('');
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this event?')) return;
    setMsg('');
    try {
      await axios.delete(`/api/events/${id}`);
      setMsg('Event deleted!');
      fetchEvents();
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Manage Events</h1>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="border rounded px-2 py-1" required />
        <input name="date" type="datetime-local" value={form.date} onChange={handleChange} className="border rounded px-2 py-1" required />
        <input name="link" value={form.link} onChange={handleChange} placeholder="Event Link (optional)" className="border rounded px-2 py-1" />
        <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL (optional)" className="border rounded px-2 py-1" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border rounded px-2 py-1 md:col-span-2" required />
        <div className="flex flex-col gap-1">
          <label className="font-medium">Image Upload</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <div className="mt-2"><img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" /></div>
          )}
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 md:col-span-2">
          {editingId ? 'Update Event' : 'Create Event'}
        </button>
      </form>
      <h2 className="text-xl font-semibold mb-4">All Events</h2>
      {loading ? (
        <div>Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-gray-500">No events found.</div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event._id} className="bg-gray-50 rounded shadow p-4 flex flex-col md:flex-row items-center">
              {event.image && <img src={event.image} alt={event.title} className="w-24 h-24 object-cover rounded mr-6 mb-4 md:mb-0" />}
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                <div className="text-gray-500 text-sm mb-2">{new Date(event.date).toLocaleString()}</div>
                <p className="mb-2">{event.description}</p>
                {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Join/More Info</a>}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button onClick={() => handleEdit(event)} className="bg-yellow-500 text-white rounded px-3 py-1 text-xs">Edit</button>
                <button onClick={() => handleDelete(event._id)} className="bg-red-600 text-white rounded px-3 py-1 text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEvents; 