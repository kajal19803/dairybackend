const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  price: { type: Number, required: true },
  images: [String], // ✅ for multiple images
  category: { type: String },
  unit: { type: String }, // ✅ changed from 'weight' to 'unit'
  ingredients: { type: String },
  nutritionalInfo: { type: String },
  inStock: { type: Boolean, default: true },
});

module.exports = mongoose.model('Product', productSchema);
