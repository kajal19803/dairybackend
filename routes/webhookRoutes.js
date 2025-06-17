const express = require('express');
require('dotenv').config();
const crypto = require('crypto');
const Order = require('./models/Order');
const router = express.Router();

router.post('/webhook/cashfree', express.raw({ type: 'application/json' }), async (req, res) => {
 try {
    console.log('\n📩 Webhook route hit');
    const rawPayload = req.body.toString('utf-8');
    require('fs').writeFileSync('raw-cashfree-payload.json', rawPayload);

    const signature = req.headers['x-webhook-signature'];
    const secret = process.env.CASHFREE_WEBHOOK_SECRET;

    console.log('🔐 Retrieved secret:', secret ? '[HIDDEN]' : '❌ MISSING');
    console.log('📬 Signature received:', signature || '❌ MISSING');

    if (!secret || !signature) {
      console.log('❌ Either secret or signature is missing');
      return res.status(400).send('Missing secret or signature');
    }
    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('base64');

    console.log('🔑 Generated HMAC:', generatedHmac);
    console.log('🔁 Received Signature:', signature);

    const hmacBuffer = Buffer.from(generatedHmac);
    const signatureBuffer = Buffer.from(signature);

    console.log('📏 HMAC Buffer Length:', hmacBuffer.length);
    console.log('📏 Signature Buffer Length:', signatureBuffer.length);
    console.log('📤 HMAC Buffer:', hmacBuffer.toString('base64'));
    console.log('📥 Signature Buffer:', signatureBuffer.toString('base64'));

    if (hmacBuffer.length !== signatureBuffer.length) {
      console.log('❌ Signature length mismatch');
      return res.status(400).send('Invalid signature format');
    }

    const isValid = crypto.timingSafeEqual(hmacBuffer, signatureBuffer);
    console.log('🔍 Signature validity:', isValid);

    if (!isValid) {
      console.log('❌ Signature mismatch (HMAC != Received Signature)');
      return res.status(400).send('Invalid signature');
    }

    const data = JSON.parse(rawPayload);
    console.log('✅ Verified Webhook Payload:', data);

    const orderId = data?.data?.order?.order_id;
    const paymentStatus = data?.data?.payment?.payment_status;

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

module.exports = router;