const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/authMiddleware');
const axios = require('axios');
require('dotenv').config();


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

    console.log("Order received from frontend:", req.body);

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', order: savedOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/payment/create-link', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { amount, phone } = req.body;

    if (!user || !user._id || !user.email) {
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
        customer_email: user.email,
        customer_phone: phone?.toString() || user.phone?.toString() || '0000000000',
      },
      order_meta: {
        notify_url: `${process.env.BACKEND_BASE_URL}/api/payment/webhook`,
        return_url: `${process.env.FRONTEND_URL}/paymentstatus?order_id=${orderId}&order_token={order_token}&order_status={order_status}`,
      },
    };

    console.log("Sending to Cashfree:", data);

    const headers = {
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, data, { headers });

    console.log(" Full Cashfree response:", response.data);

    const paymentSessionId = response.data.payment_session_id;

    if (!paymentSessionId) {
      return res.status(500).json({ error: 'Cashfree did not return a payment session ID', fullResponse: response.data });
    }

    const paymentLink = `https://payments.cashfree.com/pg/orders/${paymentSessionId}`;

    res.status(200).json({ payment_link: paymentLink, orderId });
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error(' Cashfree error:', errData);
    res.status(500).json({ error: 'Failed to create payment link', details: errData });
  }
});

module.exports = router;

