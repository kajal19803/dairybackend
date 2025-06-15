const express = require('express');
const crypto = require ('crypto');
const { authMiddleware } = require('../middleware/authMiddleware');
const Order = require('../models/Order');


const router = express.Router();

router.post ('/webhook', express.raw({ type: 'application/json' }), (req, res) =>{
  try {
    const signature = req.headers ['x-cashfree-signature'];
    const secret = process.env.CASHFREE_SECRET;

    const payload = req.body.toString('utf-8');

    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const digest = hmac.digest('base64');

    if (signature !== digest) {
      console.error('Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const data = JSON.parse(payload); 
    console.log('✅ Webhook received:', data);

   
    res.status(200).json({ status: 'Webhook received successfully' });
  } catch (err) {
    console.error('❌ Webhook Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.productId'); 

    res.json({ orders }); 
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});
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
