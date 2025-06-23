const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const Order = require('../models/Order');

const router = express.Router();

router.post(
  '/cashfree',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      console.log('\n📩 Webhook route hit');

      const rawBody = req.body.toString('utf-8');
      const receivedSignature = req.headers['x-webhook-signature'];

      if (!receivedSignature) {
        console.log('❌ Missing x-webhook-signature');
        return res.status(400).send('Missing signature');
      }

      // Optional: Save raw payload for debugging
      fs.writeFileSync('raw-cashfree-payload.json', rawBody);

      const generatedHash = crypto
        .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('base64');

      console.log('🔑 Generated Signature:', generatedHash);
      console.log('📬 Received Signature:', receivedSignature);

      if (generatedHash !== receivedSignature) {
        console.log('❌ Signature mismatch');
        return res.status(403).send('Invalid signature');
      }

      console.log('✅ Signature verified');

      const parsed = JSON.parse(rawBody);
      const orderId = parsed?.data?.order?.order_id;
      const paymentStatus = parsed?.data?.payment?.payment_status;

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
  }
);


module.exports = router;
