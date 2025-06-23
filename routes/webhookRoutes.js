const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const Order = require('../models/Order');

const router = express.Router();

// Middleware to parse JSON body correctly
router.post('/cashfree', express.json(), async (req, res) => {
  try {
    console.log('\n📩 Webhook route hit');

    const receivedSignature = req.body.signature;
    if (!receivedSignature) {
      console.log('❌ Missing signature in payload');
      return res.status(400).send('Missing signature');
    }

    // Save raw body for debugging (optional)
    fs.writeFileSync('raw-cashfree-payload.json', JSON.stringify(req.body, null, 2));

    // Remove 'signature' from body and sort the rest
    const dataToSign = { ...req.body };
    delete dataToSign.signature;

    const sortedKeys = Object.keys(dataToSign).sort();
    const postData = sortedKeys.map(key => dataToSign[key]).join('');

    const generatedHash = crypto.createHash('sha256').update(postData).digest('base64');

    console.log('🔑 Generated Signature:', generatedHash);
    console.log('📬 Received Signature:', receivedSignature);

    if (generatedHash !== receivedSignature) {
      console.log('❌ Signature mismatch');
      return res.status(403).send('Invalid signature');
    }

    console.log('✅ Signature verified');

    // Access nested data
    const orderId = req.body?.data?.order?.order_id;
    const paymentStatus = req.body?.data?.payment?.payment_status;

    if (!orderId || !paymentStatus) {
      console.log('⚠️ Missing orderId or paymentStatus in payload');
      return res.status(400).send('Invalid data');
    }

    console.log(`📦 Updating orderId: ${orderId} to status: ${paymentStatus}`);

    const updated = await Order.findOneAndUpdate(
      { orderId: orderId.toUpperCase() },
      { status: paymentStatus.toLowerCase() },
      { new: true }
    );

    if (updated) {
      console.log(`✅ Order ${orderId} updated to status: ${paymentStatus}`);
    } else {
      console.log(`❗ Order ${orderId} not found in DB`);
    }

    return res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return res.status(500).send('Internal server error');
  }
});

// Test route
router.get('/', (req, res) => {
  res.send('✅ Cashfree Webhook Route is live');
});

module.exports = router;
