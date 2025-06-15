const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/authMiddleware');
const axios = require('axios');
require('dotenv').config();

// 📦 1. Place Order Route
router.post('/orders', authMiddleware, async (req, res) => {
  try {
    const { items, address, totalPrice, phone } = req.body;
    const userId = req.user.id;

    if (!items || !address || !totalPrice) {
      return res.status(400).json({ message: 'Missing order details' });
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

// 💳 2. Create Payment Link (Payment Link Flow)
router.post('/payment/create-link', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { amount, phone, email, name } = req.body;

    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const orderId = `order_${Date.now()}`;
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
        notify_url: `${process.env.BACKEND_BASE_URL}/api/payment/webhook`,
        return_url: `${process.env.FRONTEND_URL}/paymentstatus`,
      },
    };

    const headers = {
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, { headers });

    const paymentLink = response.data.payment_link;

    if (!paymentLink) {
      return res.status(500).json({
        error: 'Cashfree did not return a valid payment link',
        raw: response.data,
      });
    }

    res.status(200).json({ payment_link: paymentLink, orderId });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Cashfree error:', errData);
    res.status(500).json({ error: 'Failed to create payment link', details: errData });
  }
});

module.exports = router;
