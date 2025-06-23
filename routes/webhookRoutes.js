const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const Order = require('../models/Order');

const router = express.Router();

router.post('/cashfree', express.json(), async (req, res) => {
  try {
    console.log('\n📩 Webhook route hit');

    // ✅ STEP 1: Extract signature from header
    const receivedSignature = req.headers['x-webhook-signature'];
    if (!receivedSignature) {
      console.log('❌ Missing x-webhook-signature in headers');
      return res.status(400).send('Missing signature');
    }

    // ✅ STEP 2: Log payload for debug
    console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
    fs.writeFileSync('cashfree-payload-debug.json', JSON.stringify(req.body, null, 2));

    // ✅ STEP 3: Recreate postData from body (excluding nothing, since no 'signature' in body)
    const dataToSign = { ...req.body };
    const sortedKeys = Object.keys(dataToSign).sort();
    const postData = sortedKeys.map(key => {
      return typeof dataToSign[key] === 'object'
        ? JSON.stringify(dataToSign[key]) // Nested objects like 'data'
        : dataToSign[key];
    }).join('');

    // ✅ STEP 4: Generate SHA-256 + base64 signature
    const hash = crypto.createHash('sha256').update(postData).digest('base64');

    console.log('📬 Received Signature:', receivedSignature);
    console.log('🔑 Generated Signature:', hash);

    if (receivedSignature !== hash) {
      console.log('❌ Signature mismatch');
      return res.status(403).send('Invalid signature');
    }

    console.log('✅ Signature verified');

    // ✅ STEP 5: Update order in DB
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

