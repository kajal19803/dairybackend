const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  discount: String,
  productLink: String, // OR you can use productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);

