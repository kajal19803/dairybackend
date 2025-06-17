const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const secret = process.env.CASHFREE_WEBHOOK_SECRET;
const payload = fs.readFileSync('payload.json', 'utf-8');

const hmac = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('base64');

console.log('✅ Signature:', hmac);
