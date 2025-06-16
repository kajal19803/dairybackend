const crypto = require('crypto');
require('dotenv').config();

const secret = process.env.CASHFREE_WEBHOOK_SECRET; // 🔁 Replace this with your actual webhook secret
const payload = '{"test": "value"}'; 

const hmac = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('base64');

console.log('✅ Signature:', hmac);
