// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/authMiddleware'); // middleware to check token

router.post('/orders', authMiddleware , async (req, res) => {
  try {
    const { items, address, totalPrice } = req.body;
    const userId = req.user.id;

    if (!items || !address || !totalPrice) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    const newOrder = new Order({
      userId,
      items,
      address,
      totalPrice,
      status: 'pending',
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', order: savedOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
