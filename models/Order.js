const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  paymentStatus: {
    type: String,
    default: 'PENDING',
  },
  customerEmail: String,          // ✅ Add this
  status: { type: String },       // ✅ Add this if you're using it separately
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;


