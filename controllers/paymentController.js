const axios = require('axios');
const Order = require('../models/Order'); // ⬅️ Add this line to import the model

const createPaymentLink = async (req, res) => {
  const { amount } = req.body;
  const url = 'https://sandbox.cashfree.com/pg/orders';

  const orderId = `order_${Date.now()}`;

  const data = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    order_note: 'Test order',
    customer_details: {
      customer_id: 'cust_001',
      customer_email: 'test@example.com',
      customer_phone: '9999999999'
    },
    return_url: 'https://dairyfrontend.onrender.com/ordersuccess'
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET,
        'x-api-version': '2022-01-01',
        'Content-Type': 'application/json'
      }
    });

    const paymentLink = response.data.payment_link;

    // ✅ Save order in MongoDB
    const newOrder = new Order({
      orderId: orderId,
      amount: amount,
      status: 'pending',
      customerEmail: 'test@example.com'
    });

    await newOrder.save();

    res.json({ payment_link: paymentLink });

  } catch (error) {
    console.error('Cashfree create payment link error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
};

module.exports = { createPaymentLink };





