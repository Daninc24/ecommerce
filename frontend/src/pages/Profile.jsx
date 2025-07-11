import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { io } from 'socket.io-client';
import { UserIcon } from '@heroicons/react/24/solid';


const Profile = () => {
  const { user, setUser } = useAuth();
  const { success, error } = useToast();
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [editing, setEditing] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [imageFile, setImageFile] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (socketRef.current) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ecommerce-do0x.onrender.com', {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('online_users', (users) => {
      setOnlineUsers(users);
    });
    socket.emit('get_online_users');
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      axios.get('/orders/my').then(res => setOrders(res.data || []));
    }
  }, [user]);

  const handleProfileChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setProfileImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = profileImage;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const res = await axios.post(`/users/${user.id}/profile-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = res.data.profileImage;
      }
      await axios.put(`/users/${user.id}`, { ...profile, profileImage: imageUrl });
      setUser({ ...user, ...profile, profileImage: imageUrl });
      success('Profile updated');
      setEditing(false);
    } catch (err) {
      err('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = e => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`/users/${user.id}/password`, passwords);
      success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (error) {
      error('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <form onSubmit={handleProfileSave} className="space-y-4 bg-white p-6 rounded shadow">
        <div className="flex items-center mb-4">
          {user.profileImage ? (
            <span className="relative inline-block">
              <img src={user.profileImage} alt="Avatar" className="h-20 w-20 rounded-full object-cover border" />
              <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </span>
          ) : (
            <span className="relative inline-block">
              <UserIcon className="h-16 w-16" />
              <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </span>
          )}
          <div className="ml-4">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center mt-1">
              <span className={`h-2 w-2 rounded-full mr-2 ${onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm">{onlineUsers.includes(user._id) ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className="mt-1 block w-full border rounded p-2" disabled={!editing} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="mt-1 block w-full border rounded p-2" disabled={!editing} />
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <button type="submit" className="btn-primary" disabled={loading}>Save</button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)} disabled={loading}>Cancel</button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>
      </form>
      <form onSubmit={handlePasswordSave} className="space-y-4 bg-white p-6 rounded shadow mt-8">
        <h2 className="text-lg font-semibold mb-2">Change Password</h2>
        <div>
          <label className="block text-sm font-medium">Current Password</label>
          <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} className="mt-1 block w-full border rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">New Password</label>
          <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} className="mt-1 block w-full border rounded p-2" required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>Change Password</button>
      </form>
      {/* User Order History */}
      {orders.length > 0 && (
        <div className="bg-white p-6 rounded shadow mt-8">
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">#{order._id.slice(-6)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {order.localAmount && order.currency && order.currency !== 'USD' ? (
                      <>
                        <span>{formatCurrency(order.localAmount, order.currency)} </span>
                        <span className="text-xs text-gray-500">/ {formatCurrency(order.usdAmount || order.totalAmount, 'USD')}</span>
                      </>
                    ) : (
                      <span>{formatCurrency(order.usdAmount || order.totalAmount, 'USD')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Profile; 