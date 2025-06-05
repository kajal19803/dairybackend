const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  paymentStatus: {
    type: String,
    default: 'PENDING',
  },
  customerEmail: String,          
  status: { type: String },      
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;


