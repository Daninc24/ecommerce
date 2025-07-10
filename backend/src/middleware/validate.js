const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  product: Joi.object({
    title: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().positive().required(),
    image: Joi.string().uri().required(),
    category: Joi.string().min(2).max(50).required(),
    stock: Joi.number().integer().min(0).required()
  }),

  cartItem: Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).max(100).required()
  }),

  order: Joi.object({
    items: Joi.array().items(Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    })).min(1).required()
  })
};

module.exports = { validate, schemas }; 