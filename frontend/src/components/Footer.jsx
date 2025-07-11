import React, { useState, useEffect } from 'react';
import axios from 'axios';

const whatsappNumber = '254791991154'; // Replace with your WhatsApp number (country code + number, no + sign)
const whatsappLink = `https://wa.me/${whatsappNumber}`;
const phoneNumber = '+254791991154'; // Replace with your phone number
const email = 'info@myshoppingcenter.com'; // Replace with your email
const facebookLink = 'https://facebook.com/myshoppingcenter'; // Replace with your Facebook page
const twitterLink = 'https://twitter.com/myshoppingcenter'; // Replace with your Twitter profile
const eventsLink = '/events';

const Footer = () => {
  // Service rating state
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [userName, setUserName] = useState('');

  // Load average from localStorage (or backend in real app)
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('serviceRatings') || '[]');
    if (stored.length > 0) {
      const avg = stored.reduce((sum, r) => sum + r.rating, 0) / stored.length;
      setAverageRating(avg);
      setRatingCount(stored.length);
    }
  }, []);

  const handleRate = (rating) => {
    setUserRating(rating);
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/testimonials', {
        rating: userRating,
        message: userMessage,
        name: userName || 'Anonymous',
      });
      setSubmitted(true);
      setUserMessage('');
      setUserName('');
    } catch (err) {
      alert('Failed to submit rating. Please try again.');
    }
  };

  return (
    <footer className="w-full bg-gray-900 text-white py-4 mt-8">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4 md:gap-0">
        <span className="text-sm mb-2 md:mb-0 text-center w-full md:w-auto">&copy; {new Date().getFullYear()} MyShopping Center. All rights reserved.</span>
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm w-full md:w-auto">
          <a href={`tel:${phoneNumber}`} className="flex items-center hover:text-orange-300 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.086c.414 0 .81.168 1.102.466l2.212 2.212a2.25 2.25 0 01.466 1.102v2.086a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 17.25h2.086c1.243 0 2.25-1.007 2.25-2.25v-2.086a2.25 2.25 0 00-.466-1.102l-2.212-2.212a2.25 2.25 0 00-1.102-.466h-2.086a2.25 2.25 0 00-2.25 2.25v2.086a2.25 2.25 0 002.25 2.25z" /></svg>
            {phoneNumber}
          </a>
          <a href={`mailto:${email}`} className="flex items-center hover:text-orange-300 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.091 7.091a2.25 2.25 0 01-3.182 0L3.909 8.584A2.25 2.25 0 013.25 6.993V6.75" /></svg>
            {email}
          </a>
          <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-orange-500 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.326 24h11.495v-9.294H9.691v-3.622h3.13V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" /></svg>
            Facebook
          </a>
          <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-orange-400 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.83 9.83 0 01-2.828.775 4.932 4.932 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 00-8.38 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.117 2.823 5.247a4.904 4.904 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 01-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 010 21.543a13.94 13.94 0 007.548 2.209c9.058 0 14.009-7.514 14.009-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0024 4.557z" /></svg>
            Twitter
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-green-400 hover:text-green-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 13.487a4.5 4.5 0 01-6.349-6.349m6.349 6.349l2.122 2.122a9 9 0 11-2.122-2.122z" />
            </svg>
            WhatsApp
          </a>
          <a href={eventsLink} className="flex items-center hover:text-purple-400 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
            Live Events
          </a>
        </div>
        <div className="w-full md:w-auto flex flex-col items-center mt-4 md:mt-0">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <svg
                  className={`w-6 h-6 ${star <= (hoverRating || userRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.386-2.46a1 1 0 00-1.175 0l-3.386 2.46c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
                </svg>
              </button>
            ))}
          </div>
          {submitted ? (
            <div className="text-green-500 text-xs mt-1">Thank you for rating!</div>
          ) : userRating > 0 && !submitted ? (
            <>
              <input
                className="mt-2 w-full rounded border px-2 py-1 text-xs text-gray-800"
                maxLength={40}
                placeholder="Your name (optional)"
                value={userName}
                onChange={e => setUserName(e.target.value)}
              />
              <textarea
                className="mt-2 w-full rounded border px-2 py-1 text-xs text-gray-800"
                rows={2}
                maxLength={200}
                placeholder="Add a comment about your experience (optional)"
                value={userMessage}
                onChange={e => setUserMessage(e.target.value)}
              />
              <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs" onClick={handleSubmit}>Submit Rating</button>
            </>
          ) : null}
          <div className="text-xs text-gray-300 mt-1">Avg: {averageRating ? averageRating.toFixed(1) : '--'} / 5 ({ratingCount} ratings)</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 