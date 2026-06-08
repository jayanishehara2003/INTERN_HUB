const CV = require('../models/CV');

exports.getCV = async (req, res) => {
  try {
    const cv = await CV.findOne({ userId: req.user.id });
    if (!cv) return res.json(null);
    res.json(cv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveCV = async (req, res) => {
  try {
    const { versions, ...cvData } = req.body;
    const existing = await CV.findOne({ userId: req.user.id });
    let existingVersions = existing?.versions || [];
    const newVersion = {
      versionNumber: existingVersions.length + 1,
      savedAt: new Date(),
      data: cvData
    };
    existingVersions = [...existingVersions, newVersion].slice(-5);
    const cv = await CV.findOneAndUpdate(
      { userId: req.user.id },
      { ...cvData, userId: req.user.id, versions: existingVersions },
      { upsert: true, new: true }
    );
    res.json({ message: 'CV saved successfully!', cv });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Track download
exports.trackDownload = async (req, res) => {
  try {
    const cv = await CV.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { downloadCount: 1 }, lastDownloaded: new Date() },
      { new: true }
    );
    res.json({ message: 'Download tracked', downloadCount: cv.downloadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin - get all CV downloads
exports.getAllCVStats = async (req, res) => {
  try {
    const cvs = await CV.find({ downloadCount: { $gt: 0 } })
      .populate('userId', 'name email createdAt')
      .select('name downloadCount lastDownloaded createdAt userId')
      .sort({ downloadCount: -1 });
    res.json(cvs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};