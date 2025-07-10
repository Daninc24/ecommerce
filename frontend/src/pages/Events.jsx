import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useToast } from '../contexts/ToastContext';

const Events = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const { info, success, warning } = useToast();

  const fetchAndSetEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/events');
      const now = new Date();
      setUpcoming(res.data.filter(e => new Date(e.date) >= now));
      setPast(res.data.filter(e => new Date(e.date) < now));
    } catch (err) {
      setUpcoming([]);
      setPast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSetEvents();
    // Setup Socket.IO for real-time updates
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ecommerce-do0x.onrender.com', { 
        transports: ['websocket'],
        withCredentials: true
      });
      socketRef.current.on('event_created', (event) => {
        fetchAndSetEvents();
        success(`New event: ${event.title}`);
      });
      socketRef.current.on('event_updated', (event) => {
        fetchAndSetEvents();
        info(`Event updated: ${event.title}`);
      });
      socketRef.current.on('event_deleted', (eventId) => {
        fetchAndSetEvents();
        warning('An event was deleted');
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Live Events</h1>
      {loading ? (
        <div className="text-center">Loading events...</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="space-y-6">
                {upcoming.map(event => (
                  <div key={event._id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row items-center">
                    {event.image && <img src={event.image} alt={event.title} className="w-32 h-32 object-cover rounded mr-6 mb-4 md:mb-0" />}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                      <div className="text-gray-500 text-sm mb-2">{new Date(event.date).toLocaleString()}</div>
                      <p className="mb-2">{event.description}</p>
                      {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Join/More Info</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Events</h2>
              <div className="space-y-6">
                {past.map(event => (
                  <div key={event._id} className="bg-gray-100 rounded shadow p-4 flex flex-col md:flex-row items-center opacity-70">
                    {event.image && <img src={event.image} alt={event.title} className="w-32 h-32 object-cover rounded mr-6 mb-4 md:mb-0" />}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                      <div className="text-gray-500 text-sm mb-2">{new Date(event.date).toLocaleString()}</div>
                      <p className="mb-2">{event.description}</p>
                      {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">More Info</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {upcoming.length === 0 && past.length === 0 && (
            <div className="text-center text-gray-500">No events found.</div>
          )}
        </>
      )}
    </div>
  );
};

export default Events; 