const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/my', protect, applicationController.getMyApplications);
router.get('/', protect, adminOnly, applicationController.getAllApplications);
router.get('/vacancy/:vacancyId', protect, adminOnly, applicationController.getApplicationsByVacancy);
router.patch('/:id/status', protect, adminOnly, applicationController.updateApplicationStatus);

module.exports = router;
