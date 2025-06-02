const axios = require('axios');
require('dotenv').config();

exports.createPaymentLink = async (req, res) => {
  const { customerName, customerEmail, customerPhone, amount } = req.body;

  try {
    const response = await axios.post(
      'https://sandbox.cashfree.com/pg/links',
      {
        customer_details: {
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        },
        order_amount: amount,
        order_currency: 'INR',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2022-09-01',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Cashfree error:', error.response.data);
    res.status(500).json({ error: 'Payment link creation failed' });
  }
};
