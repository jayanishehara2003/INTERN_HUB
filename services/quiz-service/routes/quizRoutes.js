const router = require('express').Router();
const {
  getAllQuizzes, getQuizById, createQuiz,
  updateQuiz, deleteQuiz, submitQuiz, getMyResults, getAllResults, getResultReview
} = require('../controllers/quizController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getAllQuizzes);
router.get('/results/me', protect, getMyResults);
router.get('/results/all', protect, adminOnly, getAllResults);
router.get('/results/:resultId/review', protect, getResultReview);
router.get('/:id', protect, getQuizById);
router.post('/', protect, adminOnly, createQuiz);
router.put('/:id', protect, adminOnly, updateQuiz);
router.delete('/:id', protect, adminOnly, deleteQuiz);
router.post('/:id/submit', protect, submitQuiz);

module.exports = router;