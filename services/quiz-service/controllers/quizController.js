const Quiz = require('../models/Quiz');
const Result = require('../models/QuizResult');

// GET all quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }
    const quizzes = await Quiz.find(filter)
      .select('-questions.correctAnswer')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET single quiz
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).select('-questions.correctAnswer');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST create quiz (admin only)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, questions, timeLimit } = req.body;
    if (!title || !questions?.length)
      return res.status(400).json({ message: 'Title and questions are required' });
    const normalizedCategory = (category || 'General').trim() || 'General';
    const normalizedDifficulty = ['easy', 'medium', 'hard'].includes((difficulty || '').toLowerCase())
      ? difficulty.toLowerCase()
      : 'easy';
    const quiz = await Quiz.create({
      title,
      description,
      category: normalizedCategory,
      difficulty: normalizedDifficulty,
      questions,
      timeLimit,
      createdBy: req.user.id
    });
    res.status(201).json(quiz);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT update quiz (admin only)
exports.updateQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, questions, timeLimit } = req.body;
    if (!title || !questions?.length) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const normalizedCategory = (category || 'General').trim() || 'General';
    const normalizedDifficulty = ['easy', 'medium', 'hard'].includes((difficulty || '').toLowerCase())
      ? difficulty.toLowerCase()
      : (quiz.difficulty || 'easy');

    quiz.title = title;
    quiz.description = description;
    quiz.category = normalizedCategory;
    quiz.difficulty = normalizedDifficulty;
    quiz.questions = questions;
    quiz.timeLimit = timeLimit;

    await quiz.save();
    res.json(quiz);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE quiz (admin only)
exports.deleteQuiz = async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST submit quiz answers
exports.submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { answers, studentName, studentItNumber } = req.body;
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);
    const safeName = (studentName || req.user?.name || `Student-${String(req.user?.id || '').slice(-6)}`).trim();
    const result = await Result.create({
      studentId: req.user.id,
      studentName: safeName,
      studentItNumber: String(studentItNumber || req.user?.itNumber || '').trim(),
      quizId: quiz._id,
      answers,
      score,
      total: quiz.questions.length,
      percentage
    });

    const review = quiz.questions.map((q, i) => {
      const selected = answers[i];
      const selectedIndex =
        selected != null && selected !== -1 ? selected : null;
      return {
        question: q.question,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctAnswer,
        isCorrect: selected === q.correctAnswer,
      };
    });

    res.json({
      message: 'Quiz submitted!',
      score,
      total: quiz.questions.length,
      percentage,
      result,
      quizTitle: quiz.title,
      review,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET answer review for one of my past attempts (correct answers only after attempt)
exports.getResultReview = async (req, res) => {
  try {
    const result = await Result.findOne({
      _id: req.params.resultId,
      studentId: req.user.id,
    });
    if (!result) return res.status(404).json({ message: 'Result not found' });

    const quiz = await Quiz.findById(result.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const saved = result.answers || [];
    const review = quiz.questions.map((q, i) => {
      const selected = saved[i];
      const selectedIndex =
        selected != null && selected !== -1 ? selected : null;
      return {
        question: q.question,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctAnswer,
        isCorrect: selected === q.correctAnswer,
      };
    });

    res.json({
      quizTitle: quiz.title,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      submittedAt: result.createdAt,
      review,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET my results
exports.getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user.id }).populate('quizId', 'title category difficulty').sort({ createdAt: -1 });
    res.json(results);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET all results (admin)
exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate('quizId', 'title category difficulty').sort({ createdAt: -1 });
    res.json(results);
  } catch (err) { res.status(500).json({ message: err.message }); }
};