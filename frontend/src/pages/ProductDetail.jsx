import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { Helmet } from 'react-helmet';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        // Remove all console.error statements
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    const result = await addToCart(product._id, quantity);
    if (result.success) {
      setQuantity(1);
    }
    setAddingToCart(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
        <Link to="/products" className="btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product ? `${product.title} - MyShopping Center` : 'Product - MyShopping Center'}</title>
        <meta name="description" content={product ? product.description : 'View product details, images, price, and stock at MyShopping Center.'} />
        <meta property="og:title" content={product ? `${product.title} - MyShopping Center` : 'Product - MyShopping Center'} />
        <meta property="og:description" content={product ? product.description : 'View product details, images, price, and stock at MyShopping Center.'} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://myshoppingcenter.com/products/${product ? product._id : ''}`} />
        <meta property="og:image" content={product && product.images && product.images[0] ? product.images[0] : 'https://myshoppingcenter.com/logo.png'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product ? `${product.title} - MyShopping Center` : 'Product - MyShopping Center'} />
        <meta name="twitter:description" content={product ? product.description : 'View product details, images, price, and stock at MyShopping Center.'} />
        <meta name="twitter:image" content={product && product.images && product.images[0] ? product.images[0] : 'https://myshoppingcenter.com/logo.png'} />
        <link rel="canonical" href={`https://myshoppingcenter.com/products/${product ? product._id : ''}`} />
        {product && (
          <script type="application/ld+json">{`
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "${product.title}",
              "image": [
                "${product.images && product.images[0] ? product.images[0] : 'https://myshoppingcenter.com/logo.png'}"
              ],
              "description": "${product.description}",
              "sku": "${product._id}",
              "offers": {
                "@type": "Offer",
                "url": "https://myshoppingcenter.com/products/${product._id}",
                "priceCurrency": "KES",
                "price": "${product.price}",
                "availability": "${product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}"
              }
            }
          `}</script>
        )}
      </Helmet>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-blue-600">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.title}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative">
              <img
                src={product.images && product.images.length > 0 ? product.images[selectedImage] : '/placeholder-image.jpg'}
                alt={product.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.title}</h1>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
              <span className="text-sm text-gray-500">Stock: {product.stock}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="input-field w-32"
                  disabled={product.stock === 0}
                >
                  {[...Array(Math.min(10, product.stock))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
                className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
              </button>

              {product.stock === 0 && (
                <p className="text-red-500 text-center">Out of Stock</p>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-2">Product Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span>{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span>{product._id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Products */}
        <div className="border-t pt-8">
          <Link to="/products" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Products
          </Link>
        </div>
      </div>
    </>
  );
};

export default ProductDetail; 