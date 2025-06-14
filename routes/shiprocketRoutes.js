const express = require('express');
const axios = require('axios');
const getShiprocketToken = require('../utils/getShiprocketToken');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const token = await getShiprocketToken();

    const orderData = {
      order_id: req.body.orderId,
      order_date: new Date().toISOString(),
      pickup_location: "Jabalpur Warehouse", 
      billing_customer_name: req.body.name,
      billing_address: req.body.address,
      billing_city: req.body.city,
      billing_state: req.body.state,
      billing_pincode: req.body.pincode,
      billing_country: "India",
      billing_phone: req.body.phone,
      order_items: req.body.items,  
      payment_method: "Prepaid",    
      sub_total: req.body.total,
    };

    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("🚫 Error creating Shiprocket order:", error.response?.data || error.message);
    res.status(500).json({ error: 'Shiprocket order creation failed' });
  }
});

module.exports = router;

