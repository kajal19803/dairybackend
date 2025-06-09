const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/authMiddleware'); // Ya jis auth middleware ka use ho raha ho

// POST /api/orders
router.post('/', authMiddleware , async (req, res) => {
  try {
    const { userId, items, totalPrice, address, status } = req.body;

    const newOrder = new Order({
      userId,
      items,
      totalPrice,
      address,
      status: status || 'Pending',
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Order Save Error:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

module.exports = router;
