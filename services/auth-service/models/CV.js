const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  objective: { type: String, default: '' },
  education: { type: Array, default: [] },
  experience: { type: Array, default: [] },
  skills: { type: String, default: '' },
  softSkills: { type: String, default: '' },
  projects: { type: Array, default: [] },
  certifications: { type: Array, default: [] },
  references: { type: Array, default: [] },
  versions: { type: Array, default: [] },
  downloadCount: { type: Number, default: 0 },
  lastDownloaded: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('CV', cvSchema);