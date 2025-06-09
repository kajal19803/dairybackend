const express = require('express');
const router = express.Router();
const { createPaymentLink } = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;


// Create Payment Link Route
router.post('/create-link', authMiddleware, createPaymentLink);

// ✅ FIXED Webhook Route using express.raw()
router.post ('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body;
    const payload = JSON.parse(rawBody.toString());

    console.log("Webhook received:", payload);

    const order_id = payload?.data?.order?.order_id;
    const payment_status = payload?.data?.payment?.payment_status;

    console.log("Order ID:", order_id);
    console.log("Payment Status:", payment_status);

    if (payment_status === 'SUCCESS') {
      await Order.findOneAndUpdate(
        { orderId: order_id },
        { status: 'success' }
      );
    } else {
      await Order.findOneAndUpdate(
        { orderId: order_id },
        { status: 'failed' }
      );
    }

    res.status(200).send("Webhook processed ✅");
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).send("Error processing webhook");
  }
});

// ✅ Get User's Orders
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ customerId: userId }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Manually Update Order Status
router.post('/update-order', async (req, res) => {
  const { orderId, txStatus } = req.body;

  try {
    await Order.findOneAndUpdate(
      { orderId },
      { status: txStatus.toLowerCase() }
    );

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
