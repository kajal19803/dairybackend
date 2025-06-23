const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const Order = require('../models/Order');

const router = express.Router();

router.post('/cashfree', express.json(), async (req, res) => {
  try {
    console.log('\n📩 Webhook route hit');

    // Step 1: Get the signature from body
    const receivedSignature = req.body.signature;
    if (!receivedSignature) {
      console.log('❌ Missing signature in body');
      return res.status(400).send('Missing signature');
    }

    // Optional: Save incoming payload for debugging
    fs.writeFileSync('cashfree-debug.json', JSON.stringify(req.body, null, 2));

    // Step 2: Prepare postData
    const dataToSign = { ...req.body };
    delete dataToSign.signature; // Remove signature

    const sortedKeys = Object.keys(dataToSign).sort();
    const postData = sortedKeys.map(key => dataToSign[key]).join('');

    // Step 3: Generate SHA-256 + base64 encoded signature
    const hash = crypto.createHash('sha256').update(postData).digest('base64');

    console.log('📬 Received Signature:', receivedSignature);
    console.log('🔑 Generated Signature:', hash);

    // Step 4: Compare
    if (receivedSignature !== hash) {
      console.log('❌ Signature mismatch');
      return res.status(403).send('Invalid signature');
    }

    console.log('✅ Signature verified');

    // Step 5: Handle business logic
    const orderId = req.body?.data?.order?.order_id;
    const paymentStatus = req.body?.data?.payment?.payment_status;

    if (!orderId || !paymentStatus) {
      console.log('⚠️ Missing orderId or paymentStatus');
      return res.status(400).send('Invalid data');
    }

    const updated = await Order.findOneAndUpdate(
      { orderId: orderId.toUpperCase() },
      { status: paymentStatus.toLowerCase() },
      { new: true }
    );

    if (updated) {
      console.log(`✅ Order ${orderId} updated to status: ${paymentStatus}`);
    } else {
      console.log(`❗ Order ${orderId} not found`);
    }

    return res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return res.status(500).send('Internal server error');
  }
});



module.exports = router;
