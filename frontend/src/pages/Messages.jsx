import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { io } from 'socket.io-client';

axios.defaults.withCredentials = true;

const isValidUserId = id => typeof id === 'string' && id.length > 0 && id !== 'undefined' && id !== 'null';

const Messages = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [withUser, setWithUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messagedUsers, setMessagedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const [adminId, setAdminId] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      axios.get('/users').then(res => {
        setUsers(res.data.users);
        axios.get(`/users/messages/all?ts=${Date.now()}`).then(msgRes => {
          const adminId = user.id?.toString();
          const messages = msgRes.data.messages;
          const uniqueUserIds = Array.from(new Set(
            messages
              .filter(m => m.sender === adminId || m.receiver === adminId)
              .map(m => m.sender === adminId ? m.receiver : m.sender)
          ));
          const filtered = res.data.users.filter(u => uniqueUserIds.includes(u._id));
          setMessagedUsers(filtered);
          if (filtered.length > 0) setWithUser(filtered[0]._id);
        });
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      axios.get('/users/admin-user')
        .then(res => {
          if (res.data.admin && res.data.admin._id) {
            setAdminId(res.data.admin._id);
            setWithUser(res.data.admin._id);
            setAdminError('');
          } else {
            setAdminId('');
            setWithUser('');
            setAdminError('No admin available for messaging.');
          }
        })
        .catch(() => {
          setAdminId('');
          setWithUser('');
          setAdminError('No admin available for messaging.');
        });
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' && messagedUsers.length > 0 && !isValidUserId(withUser)) {
      setWithUser(messagedUsers[0]._id);
    }
  }, [messagedUsers, user, withUser]);

  const fetchMessages = () => {
    if (!isValidUserId(withUser)) {
      setMessages([]);
      return;
    }
    setLoading(true);
    axios.get(`/users/messages?with=${withUser}`)
      .then(res => setMessages(res.data.messages))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isValidUserId(withUser)) {
      setMessages([]);
      return;
    }
    fetchMessages();
  }, [withUser]);

  useEffect(() => {
    if (!isValidUserId(withUser)) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [withUser]);

  useEffect(() => {
    if (!user) return;
    if (socketRef.current) return;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ecommerce-do0x.onrender.com', {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      if (
        (msg.sender === user._id && msg.receiver === withUser) ||
        (msg.sender === withUser && msg.receiver === user._id)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on('typing', ({ from, to }) => {
      if (to === user._id && from === withUser) setOtherTyping(true);
    });

    socket.on('stop_typing', ({ from, to }) => {
      if (to === user._id && from === withUser) setOtherTyping(false);
    });

    socket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('messages_read', ({ from, to }) => {
      if (from === withUser && to === user._id) {
        setMessages(prev =>
          prev.map(m =>
            m.sender === user._id && m.receiver === withUser ? { ...m, read: true } : m
          )
        );
      }
    });

    socket.emit('get_online_users');

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, withUser]);

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!socketRef.current || !withUser) return;
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { to: withUser });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('stop_typing', { to: withUser });
    }, 1200);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const receiver = withUser;
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', { receiver, content: message });
      }
      const res = await axios.post('/users/messages', { receiver, content: message });
      setMessages([...messages, res.data.data]);
      setMessage('');
      success('Message sent');
    } catch {
      error('Failed to send message');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Messages</h1>

      {!user ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : user.role === 'admin' && messagedUsers.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No users have messaged you yet.</div>
      ) : !isValidUserId(withUser) ? (
        <div className="p-4 text-center text-gray-500">Select a user to view messages.</div>
      ) : (
        <div className="space-y-4">
          {user.role === 'admin' && (
            <div>
              <label className="block mb-1 font-semibold">Select User</label>
              <select
                value={withUser || ''}
                onChange={e => setWithUser(e.target.value)}
                className="border rounded px-3 py-2 w-full shadow-sm"
              >
                <option value="">-- Select a user --</option>
                {messagedUsers.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          )}

          {adminError && <div className="text-red-500 font-semibold">{adminError}</div>}

          <div className="flex  items-center gap-3 text-sm text-gray-500">
            <span className={`h-2 w-2 rounded-full ${onlineUsers.includes(withUser) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span>{onlineUsers.includes(withUser) ? 'Online' : 'Offline'}</span>
            {otherTyping && <span className="text-blue-500 animate-pulse">Typing...</span>}
          </div>

          <div className="bg-white jus rounded-lg border h-96 overflow-y-auto px-4 py-3 space-y-2">
            <button onClick={fetchMessages} className="text-blue-500 hover:underline text-sm">Refresh</button>
            {loading ? <div>Loading...</div> : (
              messages.length === 0 ? <div className="text-gray-400">No messages yet.</div> : (
                messages.map((msg, idx) => {
                  const isOwn = msg.sender === user._id;
                  return (
                    <div key={msg._id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2 rounded-xl shadow-sm max-w-xs text-sm
                        ${isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'}`}
                      >
                        <div>{msg.content}</div>
                        <div className="text-xs text-right text-gray-300 mt-1">
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              className="flex-1 border rounded px-3 py-2 shadow-sm"
              placeholder="Type your message..."
              disabled={!isValidUserId(withUser) || !!adminError}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={!isValidUserId(withUser) || !message.trim() || !!adminError}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Messages;
