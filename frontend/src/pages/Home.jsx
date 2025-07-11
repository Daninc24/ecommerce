import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowRightIcon, 
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { io } from 'socket.io-client';
import { Helmet } from 'react-helmet';

const getAdvertImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('/uploads')) {
    return `https://ecommerce-do0x.onrender.com${image}`;
  }
  return image;
};

const advertTemplates = [
  {
    id: 'classic',
    render: ({ title, message, image, product, productId }) => (
      <div className="border rounded p-4 bg-white flex gap-4 items-center mb-4">
        {image && <img src={getAdvertImageUrl(image)} alt="Advert" className="w-24 h-24 object-cover rounded" />}
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-gray-700">{message}</p>
          {product && productId && <Link to={`/products/${productId}`} className="text-blue-600 underline text-xs mt-2 block">View Product</Link>}
        </div>
      </div>
    )
  },
  {
    id: 'banner',
    render: ({ title, message, image }) => (
      <div className="relative h-32 flex items-center justify-center bg-blue-100 rounded overflow-hidden mb-4">
        {image && <img src={getAdvertImageUrl(image)} alt="Advert" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-blue-900 drop-shadow">{title}</h2>
          <p className="text-blue-800 mt-1">{message}</p>
        </div>
      </div>
    )
  },
  {
    id: 'card',
    render: ({ title, message, image }) => (
      <div className="bg-gradient-to-br from-pink-100 to-yellow-100 rounded-lg p-4 flex flex-col items-center mb-4">
        {image && <img src={getAdvertImageUrl(image)} alt="Advert" className="w-20 h-20 object-cover rounded-full mb-2" />}
        <h2 className="text-lg font-bold text-pink-700">{title}</h2>
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    )
  },
  {
    id: 'left-image',
    render: ({ title, message, image, product }) => (
      <div className="flex items-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4 gap-4 mb-4">
        {image && <img src={getAdvertImageUrl(image)} alt="Advert" className="w-28 h-28 object-cover rounded-lg shadow-lg" />}
        <div>
          <h2 className="text-2xl font-bold mb-1">{title}</h2>
          <p className="text-white mb-2">{message}</p>
          {product && <span className="text-xs bg-white/20 px-2 py-1 rounded">{product}</span>}
        </div>
      </div>
    )
  },
  {
    id: 'cta-card',
    render: ({ title, message, image, product }) => (
      <div className="bg-white border-2 border-pink-400 rounded-xl p-6 flex flex-col items-center shadow-md mb-4">
        {image && <img src={getAdvertImageUrl(image)} alt="Advert" className="w-24 h-24 object-cover rounded-full border-4 border-pink-200 mb-2" />}
        <h2 className="text-xl font-bold text-pink-700 mb-1">{title}</h2>
        <p className="text-gray-700 mb-2">{message}</p>
        {product && <span className="text-xs text-pink-600 mb-2">{product}</span>}
        <button className="bg-pink-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-pink-600 transition">Shop Now</button>
      </div>
    )
  },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const { error, info, success, warning } = useToast();
  const socketRef = React.useRef(null);
  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'Electronics', name: 'Electronics' },
    { id: 'Computers & Laptops', name: 'Computers & Laptops' },
    { id: 'Mobile Phones', name: 'Mobile Phones' },
    { id: 'Accessories', name: 'Accessories' },
    { id: 'Home & Kitchen', name: 'Home & Kitchen' },
    { id: 'Sports', name: 'Sports' },
    { id: 'Fashion', name: 'Fashion' },
    { id: 'Beauty', name: 'Beauty & Personal Care' },
    { id: 'Toys', name: 'Toys & Games' },
    { id: 'Books', name: 'Books' },
    { id: 'Automotive', name: 'Automotive' },
    { id: 'Groceries', name: 'Groceries' },
    { id: 'Health', name: 'Health & Wellness' },
    { id: 'Office', name: 'Office Supplies' },
    { id: 'Garden', name: 'Garden & Outdoors' },
    { id: 'Pets', name: 'Pet Supplies' },
    { id: 'Baby', name: 'Baby & Kids' },
    { id: 'Music', name: 'Music & Instruments' },
    { id: 'Art', name: 'Art & Craft' },
    { id: 'Jewelry', name: 'Jewelry' },
    { id: 'Shoes', name: 'Shoes' },
    { id: 'Bags', name: 'Bags & Luggage' },
    { id: 'Watches', name: 'Watches' },
    { id: 'Phones', name: 'Phones & Tablets' },
    { id: 'Cameras', name: 'Cameras & Photography' },
    { id: 'Gaming', name: 'Gaming' },
    { id: 'Stationery', name: 'Stationery' },
    { id: 'Food', name: 'Food & Beverages' },
    { id: 'Tools', name: 'Tools & Hardware' },
    { id: 'Travel', name: 'Travel' },
    { id: 'Fitness', name: 'Fitness & Exercise' }
  ];
  const [adverts, setAdverts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchNewArrivals();
    fetchBestSelling();
    fetchEvents();
    fetchAdverts();
    axios.get('/testimonials')
      .then(res => setTestimonials(res.data.testimonials || []))
      .catch(() => setTestimonials([]));
    // Simulate fetching testimonials
    // setTestimonials([
    //   {
    //     name: 'Sarah Johnson',
    //     rating: 5,
    //     comment: 'Amazing quality products and fast delivery. Highly recommended!'
    //   },
    //   {
    //     name: 'Mike Chen',
    //     rating: 5,
    //     comment: 'Great customer service and competitive prices. Will shop again!'
    //   },
    //   {
    //     name: 'Emily Davis',
    //     rating: 5,
    //     comment: 'Love the variety of products and easy checkout process.'
    //   }
    // ]);
    // Real-time events
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ecommerce-do0x.onrender.com', { 
        transports: ['websocket'],
        withCredentials: true
      });
      socketRef.current.on('event_created', (event) => {
        fetchEvents();
        success(`New event: ${event.title}`);
      });
      socketRef.current.on('event_updated', (event) => {
        fetchEvents();
        info(`Event updated: ${event.title}`);
      });
      socketRef.current.on('event_deleted', (eventId) => {
        fetchEvents();
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

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data || []);
    } catch (err) {
      err('Error fetching products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      const response = await axios.get('/products');
      setNewArrivals((response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4));
    } catch (err) {
      setNewArrivals([]);
    }
  };

  const fetchBestSelling = async () => {
    try {
      const response = await axios.get('/products/best-selling');
      setBestSelling(response.data || []);
    } catch (err) {
      setBestSelling([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/events?upcoming=true');
      setEvents(response.data || []);
    } catch (err) {
      setEvents([]);
    }
  };

  const fetchAdverts = async () => {
    try {
      const res = await axios.get('/adverts/active');
      setAdverts(res.data.adverts || []);
    } catch {
      setAdverts([]);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? (products || []).slice(0, 8) 
    : (products || []).filter(p => p.category === selectedCategory).slice(0, 8);

  const features = [
    {
      icon: TruckIcon,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: ArrowPathIcon,
      title: 'Easy Returns',
      description: '30-day return policy'
    },
    {
      icon: CreditCardIcon,
      title: 'Multiple Payment',
      description: 'Credit card, PayPal, and more'
    }
  ];

  const nextEvent = events.length > 0 ? events[0] : null;

  if (loading) return <LoadingSpinner />;

  // Helper to split adverts for different screen areas
  const splitAdverts = (adverts) => {
    if (adverts.length <= 3) return { top: adverts, middle: [], bottom: [] };
    return {
      top: adverts.slice(0, 2),
      middle: adverts.slice(2, 4),
      bottom: adverts.slice(4)
    };
  };

  const { top: topAdverts, middle: middleAdverts, bottom: bottomAdverts } = splitAdverts(adverts);

  return (
    <>
      <Helmet>
        <title>MyShopping Center - Your One-Stop Shopping Destination</title>
        <meta name="description" content="Shop the best products, discover deals, and enjoy fast delivery at MyShopping Center. Electronics, fashion, home, and more!" />
        <meta name="keywords" content="shopping, ecommerce, deals, electronics, fashion, home, delivery, online store" />
        <meta property="og:title" content="MyShopping Center - Your One-Stop Shopping Destination" />
        <meta property="og:description" content="Shop the best products, discover deals, and enjoy fast delivery at MyShopping Center." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://myshoppingcenter.com/" />
        <meta property="og:image" content="https://myshoppingcenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MyShopping Center - Your One-Stop Shopping Destination" />
        <meta name="twitter:description" content="Shop the best products, discover deals, and enjoy fast delivery at MyShopping Center." />
        <meta name="twitter:image" content="https://myshoppingcenter.com/logo.png" />
        <link rel="canonical" href="https://myshoppingcenter.com/" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "MyShopping Center",
            "url": "https://myshoppingcenter.com/",
            "logo": "https://myshoppingcenter.com/logo.png",
            "sameAs": [
              "https://www.facebook.com/myshoppingcenter",
              "https://twitter.com/myshoppingcenter"
            ]
          }
        `}</script>
      </Helmet>
      {/* Top Adverts Section */}
      {topAdverts.length > 0 && (
        <section className="max-w-3xl mx-auto mt-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {topAdverts.map(ad => {
            const Template = advertTemplates.find(t => t.id === (ad.template || 'classic'))?.render;
            return Template ? (
              <div key={ad._id}>{Template({
                title: ad.title,
                message: ad.message,
                image: ad.image,
                product: ad.product?.title || ad.product?.name,
                productId: ad.product?._id || ad.product
              })}</div>
            ) : null;
          })}
        </section>
      )}
      {/* Live Event Banner */}
      {nextEvent && (
        <div className="bg-gradient-to-r from-purple-600 to-orange-600 text-white py-4 px-4 flex items-center justify-center relative">
          {nextEvent.image && (
            <img src={nextEvent.image} alt={nextEvent.title} className="w-20 h-20 object-cover rounded shadow-lg mr-6 hidden sm:block" />
          )}
          <div className="flex-1">
            <div className="text-lg font-bold">Live Event: {nextEvent.title}</div>
            <div className="text-sm mb-1">{new Date(nextEvent.date).toLocaleString()}</div>
            <div className="text-sm line-clamp-1">{nextEvent.description}</div>
          </div>
          {nextEvent.link && (
            <a href={nextEvent.link} target="_blank" rel="noopener noreferrer" className="ml-4 bg-white text-orange-700 px-4 py-2 rounded font-semibold hover:bg-orange-100 transition-colors">Join/More Info</a>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Welcome to MyShopping
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              Discover amazing products at unbeatable prices. Shop with confidence and enjoy premium quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Now
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium products
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-8 p-2">
            {/* Hamburger Menu for All Screens */}
            <div className="w-full">
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="flex items-center justify-center w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {showCategoryMenu ? (
                  <XMarkIcon className="h-5 w-5 mr-2" />
                ) : (
                  <Bars3Icon className="h-5 w-5 mr-2" />
                )}
                {selectedCategory === 'all' ? 'All Categories' : categories.find(cat => cat.id === selectedCategory)?.name || 'All Categories'}
              </button>
              
              {/* Dropdown Menu */}
              {showCategoryMenu && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowCategoryMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedCategory === category.id
                          ? 'bg-orange-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No products available at the moment.</p>
              </div>
            )}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              View All Products
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-orange-700 text-white" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Join thousands of satisfied customers today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/products"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Live Events Section */}
      {events.length > 0 && (
        <section className="py-8 bg-purple-50 border-b border-purple-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">Upcoming Live Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map(event => (
                <div key={event._id} className="bg-white rounded shadow p-4 flex flex-col">
                  {event.image && <img src={event.image} alt={event.title} className="w-full h-40 object-cover rounded mb-3" />}
                  <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                  <div className="text-gray-500 text-sm mb-2">{new Date(event.date).toLocaleString()}</div>
                  <p className="mb-2 line-clamp-2">{event.description}</p>
                  {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Join/More Info</a>}
                </div>
              ))}
            </div>
            <div className="text-right mt-4">
              <Link to="/events" className="text-purple-700 hover:underline font-medium">See all events</Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <ArrowRightIcon className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newArrivals.map(product => (
              <ProductCard key={product._id} product={product} small />
            ))}
          </div>
        </div>
      </section>

      {/* Best Selling Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <StarIcon className="h-6 w-6 text-orange-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Best Selling</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bestSelling.map(product => (
              <ProductCard key={product._id} product={product} small />
            ))}
          </div>
        </div>
      </section>

      {/* Middle Adverts Section */}
      {middleAdverts.length > 0 && (
        <section className="max-w-3xl mx-auto my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {middleAdverts.map(ad => {
            const Template = advertTemplates.find(t => t.id === (ad.template || 'classic'))?.render;
            return Template ? (
              <div key={ad._id}>{Template({
                title: ad.title,
                message: ad.message,
                image: ad.image,
                product: ad.product?.title || ad.product?.name,
                productId: ad.product?._id || ad.product
              })}</div>
            ) : null;
          })}
        </section>
      )}

      {/* Bottom Adverts Section */}
      {bottomAdverts.length > 0 && (
        <section className="max-w-3xl mx-auto my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {bottomAdverts.map(ad => {
            const Template = advertTemplates.find(t => t.id === (ad.template || 'classic'))?.render;
            return Template ? (
              <div key={ad._id}>{Template({
                title: ad.title,
                message: ad.message,
                image: ad.image,
                product: ad.product?.title || ad.product?.name,
                productId: ad.product?._id || ad.product
              })}</div>
            ) : null;
          })}
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                What Our Customers Say
              </h2>
              <p className="text-lg text-gray-600">
                Don't just take our word for it
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.message}"</p>
                  <p className="font-semibold text-gray-900">{testimonial.name || 'Anonymous'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home; 