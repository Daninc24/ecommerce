// Simple in-memory cart storage (in production, you'd use Redis or database)
const carts = new Map();

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id.toString();

    if (!carts.has(userId)) {
      carts.set(userId, []);
    }

    const userCart = carts.get(userId);
    const existingItem = userCart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      userCart.push({ productId, quantity });
    }

    res.json({ message: 'Item added to cart', cart: userCart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user cart
const getCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userCart = carts.get(userId) || [];
    
    res.json({ cart: userCart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id.toString();

    if (!carts.has(userId)) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const userCart = carts.get(userId);
    const updatedCart = userCart.filter(item => item.productId !== productId);
    
    carts.set(userId, updatedCart);
    
    res.json({ message: 'Item removed from cart', cart: updatedCart });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update item quantity in cart
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id.toString();

    if (!carts.has(userId)) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const userCart = carts.get(userId);
    const item = userCart.find(item => item.productId === productId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      const updatedCart = userCart.filter(item => item.productId !== productId);
      carts.set(userId, updatedCart);
      res.json({ message: 'Item removed from cart', cart: updatedCart });
    } else {
      // Update quantity
      item.quantity = quantity;
      carts.set(userId, userCart);
      res.json({ message: 'Quantity updated', cart: userCart });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear cart (after order placement)
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    carts.delete(userId);
    
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity,
  clearCart
}; 