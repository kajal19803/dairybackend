const express = require('express');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/authMiddleware');
const Order = require('../models/Order');

const webhookRouter = express.Router();
const router = express.Router();

 webhookRouter.post('/', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    console.log('📩 Webhook route hit');

    const signature = req.headers['x-cashfree-signature'];
    const secret = process.env.CASHFREE_SECRET;

    console.log('🔐 Retrieved secret:', secret ? '[HIDDEN]' : '❌ MISSING');
    console.log('📬 Signature received:', signature || '❌ MISSING');

    if (!secret) {
      console.log('❌ Missing Cashfree secret');
      return res.status(500).send('Secret missing');
    }

    if (!signature) {
      console.log('❌ Missing signature header');
      return res.status(400).send('Signature header missing');
    }

    const payload = req.body.toString('utf-8');
    console.log('📦 Raw Payload:', payload);

    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('base64');
    console.log('🔏 Generated HMAC:', hmac);

    const hmacBuffer = Buffer.from(hmac);
    const signatureBuffer = Buffer.from(signature);

    console.log('📏 HMAC Length:', hmacBuffer.length);
    console.log('📏 Signature Length:', signatureBuffer.length);

    if (hmacBuffer.length !== signatureBuffer.length) {
      console.log('❌ Signature format mismatch');
      return res.status(400).send('Invalid signature format');
    }

    const isValid = crypto.timingSafeEqual(hmacBuffer, signatureBuffer);
    console.log('🔍 Signature validity:', isValid);

    if (!isValid) {
      console.log('❌ Signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    const data = JSON.parse(payload);
    console.log('✅ Verified Webhook:', data);

    // 🚀 You can now process the webhook data
    return res.status(200).send('Webhook received');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return res.status(500).send('Internal error');
  }
});




router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.productId');

    res.json({ orders });
  } catch (error) {
    console.error('❌ Error fetching my-orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// 🕒 Get 3 most recent orders for chatbot/ticket
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('_id items')
      .populate('items.productId', 'name');

    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      productNames: order.items.map(item => item.productId?.name || 'Unknown Product'),
    }));

    res.json({ orders: formattedOrders });
  } catch (err) {
    console.error('❌ Error in /recent:', err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

module.exports = router;
module.exports.webhookOnly = webhookRouter;
