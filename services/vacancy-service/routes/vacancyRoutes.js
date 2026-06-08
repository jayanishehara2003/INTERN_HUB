const express = require('express');
const router = express.Router();
const vacancyController = require('../controllers/vacancyController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Admin create vacancy
router.post('/', protect, adminOnly, vacancyController.createVacancy);

// User-visible vacancies only
router.get('/', vacancyController.getVisibleVacancies);

// Admin can see all vacancies
router.get('/admin/all', protect, adminOnly, vacancyController.getAllVacancies);

// Increment vacancy view count
router.patch('/:id/view', vacancyController.incrementVacancyView);

// Single vacancy
router.get('/:id', vacancyController.getVacancyById);

// Admin update vacancy
router.put('/:id', protect, adminOnly, vacancyController.updateVacancy);

// Admin delete vacancy
router.delete('/:id', protect, adminOnly, vacancyController.deleteVacancy);

// User apply
router.post('/:id/apply', protect, upload.single('cv'), vacancyController.applyVacancy);

module.exports = router;