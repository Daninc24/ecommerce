import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { ShoppingCartIcon, EyeIcon } from '@heroicons/react/24/outline';

const ProductCard = ({ product, small }) => {
  const { addToCart, currency, convertPrice } = useCart();
  const { success } = useToast();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product._id, 1);
    success(`${product.title} added to cart!`);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group ${small ? 'max-w-[180px] w-full sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px]' : ''}`} style={small ? { fontSize: '0.92rem' } : {}}>
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.jpg'}
          alt={product.title}
          className={`w-full ${small ? 'h-24 sm:h-28 md:h-32 lg:h-36' : 'h-48 sm:h-56 md:h-64'} object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300`}
          style={{ objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
        
        {/* Image Count Badge */}
        {product.images && product.images.length > 1 && (
          <div className="absolute top-2 left-2">
            <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
              {product.images.length} photos
            </span>
          </div>
        )}
        
        {/* Quick Actions Overlay */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            to={`/products/${product._id}`}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4 text-gray-600" />
          </Link>
          <button
            onClick={handleAddToCart}
            className="p-2 bg-orange-600 text-white rounded-full shadow-md hover:bg-orange-700 transition-colors"
            title="Add to Cart"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Stock Badge */}
        {product.stock <= 10 && product.stock > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              Low Stock ({product.stock})
            </span>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={`${small ? 'p-2 sm:p-3 md:p-4' : 'p-4 sm:p-5'}`}>
        {/* Category */}
        <div className="mb-1">
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors ${small ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
          {product.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price and Actions */}
        <div className={`flex items-center justify-between ${small ? 'mt-1' : 'mt-2'}`}>
          <span className={`font-bold text-gray-900 ${small ? 'text-base' : 'text-2xl'}`}>
            {currency === 'USD'
              ? `$${product.price.toFixed(2)} USD`
              : `${convertPrice(product.price).toFixed(2)} ${currency}`}
          </span>
          <div className="flex space-x-1">
            <Link
              to={`/products/${product._id}`}
              className={`border border-orange-600 rounded-md flex items-center justify-center ${small ? 'p-1' : 'px-3 py-2'} text-orange-600 hover:bg-orange-50 transition-colors`}
              title="View"
            >
              <EyeIcon className={`${small ? 'h-4 w-4' : 'h-4 w-4 mr-1'}`} />
              {!small && <span className="hidden sm:inline">View</span>}
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`rounded-md flex items-center justify-center transition-colors ${
                product.stock === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              } ${small ? 'p-1' : 'px-3 py-2'}`}
              title="Add to Cart"
            >
              <ShoppingCartIcon className="h-4 w-4" />
              {!small && <span className="hidden sm:inline">Add</span>}
            </button>
          </div>
        </div>
        {/* Stock */}
        {product.stock > 0 && (
          <span className={`text-xs text-gray-500 ${small ? 'block mt-1' : ''}`}>{product.stock} in stock</span>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 