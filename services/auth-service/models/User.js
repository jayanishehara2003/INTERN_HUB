const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  phone: {
    type: String,
    trim: true
  },
  itNumber: {
    type: String,
    trim: true
  },
  photo: {
    type: String
  }
  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
