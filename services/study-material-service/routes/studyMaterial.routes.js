const express = require("express");
const router = express.Router();

const {
  createStudyMaterial,
  getAllStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
} = require("../controllers/studyMaterial.controller");

router.post("/", createStudyMaterial);
router.get("/", getAllStudyMaterials);
router.get("/:id", getStudyMaterialById);
router.put("/:id", updateStudyMaterial);
router.delete("/:id", deleteStudyMaterial);

module.exports = router;