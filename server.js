const express = require('express');
const cors = require ( 'cors');
require('dotenv').config();
const axios = require('axios');
const mongoose = require ('mongoose');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const crypto = require('crypto');

const Order = require('./models/Order');

console.log('🔑 [DEPLOY] Webhook Secret Loaded:', process.env.CASHFREE_WEBHOOK_SECRET ? '✅ PRESENT' : '❌ MISSING');
const emailOtpRoute = require('./routes/emailOtp');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const offerRoutes = require('./routes/offer');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const shiprocketRoutes = require('./routes/shiprocketRoutes');


const User = require('./models/User');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: [ 'GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/payment/webhook', express.raw({ type: '*/*' }), async (req, res) => {
 try {
    console.log('\n📩 Webhook route hit');

    const signature = req.headers['x-webhook-signature'];
    const secret = process.env.CASHFREE_WEBHOOK_SECRET;

    console.log('🔐 Retrieved secret:', secret ? '[HIDDEN]' : '❌ MISSING');
    console.log('📬 Signature received:', signature || '❌ MISSING');

    if (!secret || !signature) {
      console.log('❌ Either secret or signature is missing');
      return res.status(400).send('Missing secret or signature');
    }

    const payload = req.body.toString('utf-8');
    console.log('📦 Raw Payload:', payload);

    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(payload)
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

    const data = JSON.parse(payload);
    console.log('✅ Verified Webhook Payload:', data);

    const orderId = data?.data?.order?.order_id;
    const paymentStatus = data?.data?.payment?.payment_status;

    if (!orderId || !paymentStatus) {
      console.log('⚠️ Missing orderId or paymentStatus in payload');
      return res.status(400).send('Invalid data');
    }

    console.log(`📦 Updating orderId: ${orderId} to status: ${paymentStatus}`);

    const updated = await Order.findOneAndUpdate(
      { orderId },
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




app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(' MongoDB connected'))
.catch(err => console.error(' MongoDB connection error:', err));


app.get('/', (req, res) => {
  res.send(' Backend is running');
});


app.use('/api/auth', authRoutes);
app.use('/api/email-otp', emailOtpRoute);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/shiprocket', shiprocketRoutes);

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, password: '', image: picture });
      await user.save();
    }

    const authToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token: authToken, user });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(400).json({ message: 'Google authentication failed' });
  }
});


app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email, isAdmin: user.isAdmin || false }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/auth/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    return res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ message: 'Invalid token or unauthorized' });
  }
});


app.post('/api/auth/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    const { oldPassword, newPassword } = req.body;
    if (!user || !user.password || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Cannot reset password for this user' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
