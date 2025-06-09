const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      id: String,
      name: String,
      price: String,
      quantity: Number,
      image: String,
    },
  ],
  totalPrice: Number,
  address: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    phone: String,
  },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Declare model first
const Order = mongoose.model('Order', orderSchema);

// ✅ Then export it
module.exports = Order;


