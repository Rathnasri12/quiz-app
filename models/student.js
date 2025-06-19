const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  otp: String,
  otpExpires: Date,
  isVerified: { type: Boolean, default: false },
  hasSubmitted: { type: Boolean, default: false },
  score: Number,
  submittedAt: Date,
  submittedAnswers: Object,
  sectionScores: Object
});

module.exports = mongoose.model('Student', studentSchema);
