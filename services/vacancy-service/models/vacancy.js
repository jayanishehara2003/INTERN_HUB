const mongoose = require("mongoose");

const VacancySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    deadline: { type: Date, required: true },
    postedBy: { type: String },
    imageUrl: { type: String, default: '' },
    salary: { type: String, default: '' },
    jobType: {
      type: String,
      enum: ['Internship', 'Full-time', 'Part-time'],
      default: 'Internship'
    },
    skills: { type: [String], default: [] },
    applicationUrl: { type: String, default: '' },
    viewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vacancy", VacancySchema);