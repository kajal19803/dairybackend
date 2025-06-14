const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    }
  ],
  totalPrice: { type: Number, required: true },
  address: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    
  },
  status: { type: String, default: 'pending' },
  phone: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);



