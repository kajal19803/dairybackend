const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/authMiddleware');
const axios = require('axios');
require('dotenv').config();

// 📦 1. Place Order Route
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, address, totalPrice, phone } = req.body;
    const userId = req.user.id;

    if (!items || !address || !totalPrice) {
      return res.status(400).json ({ message: 'Missing order details' });
    }

    const orderId = `ORDER_${Date.now()}`;
    const newOrder = new Order({
      orderId,
      userId,
      items,
      address,
      totalPrice,
      phone,
      status: 'pending',
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', order: savedOrder });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/payment/create-link', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { amount, phone, email, name, orderId: providedOrderId } = req.body;

    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const orderId = providedOrderId || `order_${Date.now()}`;
    const url = 'https://api.cashfree.com/pg/orders';

    const data = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      order_note: 'Dairy product purchase',
      customer_details: {
        customer_id: user._id.toString(),
        customer_email: email || user.email || 'test@example.com',
        customer_phone: phone?.toString() || user.phone?.toString() || '0000000000',
        customer_name: name || 'Customer',
      },
      order_meta: {
        notify_url: "https://dairybackend-jxab.onrender.com/api/payment/webhook",
        return_url: "https://dairyfrontend.onrender.com/paymentstatus",
      },
    };

    const headers = {
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, { headers });

    const sessionId = response.data.payment_session_id;

    if (!sessionId) {
      return res.status(500).json({
        error: 'Cashfree did not return a session ID',
        raw: response.data,
      });
    }

    res.status(200).json({ session_id: sessionId, orderId });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Cashfree error:', errData);
    res.status(500).json({ error: 'Failed to create payment session', details: errData });
  }
});



module.exports = router;
