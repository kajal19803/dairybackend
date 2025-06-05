const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,  // password null ho sakta hai Google login users ke liye
  googleId: String,  // Google OAuth ID
  // aur bhi fields agar chaiye
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
