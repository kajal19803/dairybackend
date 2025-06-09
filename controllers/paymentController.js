const axios = require('axios');
const Order = require('../models/Order');

const createPaymentLink = async (req, res) => {
  try {
    const user = req.user;

    // ✅ 1. User validation
    if (!user || !user._id || !user.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { amount } = req.body;

    // ✅ 2. Amount validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // ✅ 3. Prepare order data
    const orderId = `order_${Date.now()}`;
    const url = 'https://api.cashfree.com/pg/orders'; // ✅ Production URL

    const data = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      order_note: 'Dairy product purchase',
      customer_details: {
        customer_id: user._id.toString(),
        customer_email: user.email,
        customer_phone: user.phone || '9999999999'
      },
      return_url: `https://dairyfrontend.onrender.com/paymentstatus?order_id=${orderId}&order_token={{order_token}}&order_status={{order_status}}`
    };

    // ✅ 4. Real API credentials
    const headers = {
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET,
      'x-api-version': '2022-01-01',
      'Content-Type': 'application/json'
    };

    // ✅ 5. Request to Cashfree API
    const response = await axios.post(url, data, { headers });

    const paymentLink = response.data.payment_link;

    if (!paymentLink) {
      return res.status(500).json({ error: 'Cashfree did not return a payment link' });
    }

    // ✅ 6. Save Order in DB
    const newOrder = new Order({
      orderId,
      amount: Number(amount),
      status: 'pending',
      customerEmail: user.email,
      customerId: user._id
    });

    await newOrder.save();

    // ✅ 7. Send response
    res.status(200).json({
      payment_link: paymentLink,
      orderId
    });

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Cashfree Error:', errData);

    res.status(500).json({ error: 'Failed to create payment link', details: errData });
  }
};

module.exports = { createPaymentLink };

