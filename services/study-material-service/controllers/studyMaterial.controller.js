const StudyMaterial = require("../models/StudyMaterial");

// POST /api/study-materials
exports.createStudyMaterial = async (req, res) => {
  try {
    const { title, description, category, fileUrl } = req.body;

    const item = await StudyMaterial.create({
      title,
      description,
      category,
      fileUrl,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/study-materials
exports.getAllStudyMaterials = async (req, res) => {
  try {
    const items = await StudyMaterial.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/study-materials/:id
exports.getStudyMaterialById = async (req, res) => {
  try {
    const item = await StudyMaterial.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/study-materials/:id
exports.updateStudyMaterial = async (req, res) => {
  try {
    const item = await StudyMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/study-materials/:id
exports.deleteStudyMaterial = async (req, res) => {
  try {
    const item = await StudyMaterial.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};