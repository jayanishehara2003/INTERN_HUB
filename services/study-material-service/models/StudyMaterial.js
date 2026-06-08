const mongoose = require("mongoose");

const StudyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    category: {
      type: String
    },
    fileUrl: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyMaterial", StudyMaterialSchema);