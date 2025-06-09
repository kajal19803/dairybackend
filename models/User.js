const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  googleId: String,
  address: {
    fullName: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' }
  },
  phoneNumber: { type: String, default: '' },

  // ✅ Admin field
  isAdmin: {
    type: Boolean,
    default: false, // sab users normal honge by default
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;


