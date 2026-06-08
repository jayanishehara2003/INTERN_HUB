const router = require('express').Router();
const { getCV, saveCV, trackDownload, getAllCVStats } = require('../controllers/cvController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getCV);
router.post('/', protect, saveCV);
router.post('/track-download', protect, trackDownload);
router.get('/admin/stats', protect, adminOnly, getAllCVStats);

module.exports = router;