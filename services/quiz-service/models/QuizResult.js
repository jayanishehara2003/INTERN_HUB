const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String },
  studentItNumber: { type: String },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{ type: Number }],
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);