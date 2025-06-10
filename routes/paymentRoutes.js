const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Raw body parser is needed for webhook verification
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-cashfree-signature'];
    const secret = process.env.CASHFREE_CLIENT_SECRET;

    const payload = req.body.toString('utf-8');

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const digest = hmac.digest('base64');

    if (signature !== digest) {
      console.error('Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const data = JSON.parse(payload); // Now it's safe to parse
    console.log('✅ Webhook received:', data);

    // TODO: Update order/payment status in DB based on `data.order.order_id` or `data.payment.payment_status`

    res.status(200).json({ status: 'Webhook received successfully' });
  } catch (err) {
    console.error('❌ Webhook Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Fetching user orders error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


export default router;
