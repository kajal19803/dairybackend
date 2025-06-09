// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  price: Number, // Final selling price
  mrp: Number,   // Original price
  discount: Number, // Discount percentage
  inStock: Boolean,
  category: String,
  // add more fields if needed
}, { timestamps: true });

module.exports = mongoose.model ('Product', productSchema);
