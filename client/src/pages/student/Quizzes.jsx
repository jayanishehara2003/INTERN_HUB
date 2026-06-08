import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const QUIZ_API = 'http://localhost:5004/api/quizzes';
const REMOVED_CATEGORIES = ['Technical', 'Aptitude', 'HR Interview', 'HR', 'Communication', 'Reasoning'];
const CATEGORY_CARDS = [
  { id: 'software', icon: '💻', title: 'Software Engineering', keywords: ['software', 'programming', 'web', 'data structures', 'algorithms', 'system design'] },
  { id: 'networking', icon: '🌐', title: 'Networking & Infrastructure', keywords: ['network', 'infrastructure', 'operating systems', 'computer networks'] },
  { id: 'database', icon: '🗄️', title: 'Database & Data Management', keywords: ['database', 'data management', 'sql', 'nosql', 'data'] },
  { id: 'cybersecurity', icon: '🔐', title: 'Cybersecurity', keywords: ['security', 'cyber', 'owasp', 'encryption', 'authentication'] },
  { id: 'ai-ml', icon: '🤖', title: 'Artificial Intelligence & Machine Learning', keywords: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'deep learning'] },
  { id: 'cloud-devops', icon: '☁️', title: 'Cloud Computing & DevOps', keywords: ['cloud', 'devops', 'docker', 'kubernetes', 'ci/cd', 'aws', 'azure', 'gcp'] },
];
const CATEGORY_TITLES = CATEGORY_CARDS.map((c) => c.title);

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [pastReview, setPastReview] = useState(null);
  const [pastReviewLoading, setPastReviewLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState('All');
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState(null);
  const [identityError, setIdentityError] = useState('');
  const [identity, setIdentity] = useState(() => {
    const cached = localStorage.getItem('quiz_identity');
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore */ }
    }
    return { studentName: user?.name || '', studentItNumber: '' };
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!activeQuiz || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, activeQuiz]);

  const fetchData = async () => {
    try {
      const [quizRes, resultRes] = await Promise.all([
        fetch(QUIZ_API, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${QUIZ_API}/results/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const quizData = await quizRes.json();
      const resultData = await resultRes.json();
      setQuizzes(Array.isArray(quizData) ? quizData : []);
      setResults(Array.isArray(resultData) ? resultData : []);
    } catch (err) { console.error('Failed to fetch quizzes'); }
    finally { setLoading(false); }
  };

  const startQuiz = async (quiz) => {
    if (!identity.studentName?.trim() || !identity.studentItNumber?.trim()) {
      setPendingQuiz(quiz);
      setShowIdentityModal(true);
      return;
    }
    try {
      const res = await fetch(`${QUIZ_API}/${quiz._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActiveQuiz(data);
      setAnswers({});
      setQuizResult(null);
      setTimeLeft((data.timeLimit || 30) * 60);
    } catch (err) { console.error('Failed to load quiz'); }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answerArray = activeQuiz.questions.map((_, i) => answers[i] ?? -1);
      const res = await fetch(`${QUIZ_API}/${activeQuiz._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          answers: answerArray,
          studentName: identity.studentName?.trim(),
          studentItNumber: identity.studentItNumber?.trim(),
        })
      });
      const data = await res.json();
      setQuizResult(data);
      setActiveQuiz(null);
      setTimeLeft(null);
      fetchData();
    } catch (err) { console.error('Failed to submit quiz'); }
    finally { setSubmitting(false); }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'A+', color: 'text-green-600' };
    if (pct >= 80) return { label: 'A', color: 'text-green-500' };
    if (pct >= 70) return { label: 'B', color: 'text-blue-600' };
    if (pct >= 60) return { label: 'C', color: 'text-yellow-600' };
    return { label: 'F', color: 'text-red-600' };
  };

  const fetchPastReview = async (resultId) => {
    setPastReviewLoading(true);
    setPastReview(null);
    try {
      const res = await fetch(`${QUIZ_API}/results/${resultId}/review`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load review');
      setPastReview(data);
    } catch (e) {
      console.error(e);
      setPastReview({ error: e.message || 'Could not load answers' });
    } finally {
      setPastReviewLoading(false);
    }
  };

  const renderAnswerReview = (review, submittedAt, { embedded } = {}) => {
    if (!review?.length) return null;
    const wrap = embedded
      ? 'text-left'
      : 'mt-8 text-left border-t border-gray-100 pt-8';
    return (
      <div className={wrap}>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Answer review</h2>
        <p className="text-sm text-gray-500 mb-6">
          Green is the correct answer
          {submittedAt && (
            <> · Submitted {new Date(submittedAt).toLocaleString()}</>
          )}
        </p>
        <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
          {review.map((row, qi) => (
            <div
              key={qi}
              className={`rounded-2xl border-2 p-5 ${
                row.isCorrect ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50/50'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                    row.isCorrect ? 'bg-green-600' : 'bg-red-500'
                  }`}
                >
                  {qi + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-base">{row.question}</p>
                  {row.selectedIndex == null && (
                    <p className="text-amber-700 text-sm mt-1">You did not answer this question.</p>
                  )}
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                    row.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {row.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <ul className="space-y-2 ml-11">
                {row.options.map((opt, oi) => {
                  const isCorrect = oi === row.correctIndex;
                  const isChosen = oi === row.selectedIndex;
                  let box =
                    'border-gray-200 bg-white text-gray-700';
                  if (isCorrect) box = 'border-green-500 bg-green-50 text-green-900 ring-1 ring-green-200';
                  else if (isChosen && !isCorrect)
                    box = 'border-red-400 bg-red-50 text-red-900 ring-1 ring-red-200';
                  return (
                    <li
                      key={oi}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium ${box}`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const closePastReview = () => {
    setPastReview(null);
    setPastReviewLoading(false);
  };

  const confirmIdentityAndStart = async () => {
    if (!identity.studentName?.trim() || !identity.studentItNumber?.trim() || !pendingQuiz) {
      setIdentityError('Student name and IT number are required.');
      return;
    }
    const itNumber = identity.studentItNumber.trim();
    if (!/^it\d{8}$/i.test(itNumber)) {
      setIdentityError('Invalid IT number format. Use IT followed by 8 digits (e.g. IT20230001).');
      return;
    }
    setIdentityError('');
    localStorage.setItem('quiz_identity', JSON.stringify({
      studentName: identity.studentName.trim(),
      studentItNumber: itNumber.toUpperCase(),
    }));
    setShowIdentityModal(false);
    const quiz = pendingQuiz;
    setPendingQuiz(null);
    await startQuiz(quiz);
  };

  const downloadStudentPdf = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const title = selectedCard === 'All' ? 'Student Overall Quiz Report' : `Student Quiz Report - ${activeCard?.title || selectedCard}`;
      const rows = selectedCard === 'All' ? overallResults : filteredResults;
      let y = 14;
      pdf.setFontSize(14);
      pdf.text(title, 12, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 12, y);
      y += 7;
      const insight = selectedCard === 'All' ? overallInsights : categoryInsights;
      pdf.text(`Attempts: ${rows.length}`, 12, y); y += 6;
      pdf.text(`Accuracy: ${insight.accuracyPct}%`, 12, y); y += 8;
      pdf.text('Recent Attempts:', 12, y); y += 6;
      rows.slice(0, 20).forEach((r, i) => {
        const line = `${i + 1}. ${r.quizId?.title || 'Quiz'} | ${r.percentage}% | ${new Date(r.createdAt).toLocaleDateString()}`;
        pdf.text(line.slice(0, 110), 12, y);
        y += 5;
        if (y > 280) { pdf.addPage(); y = 12; }
      });
      pdf.save(selectedCard === 'All' ? 'student-overall-report.pdf' : `${selectedCard}-report.pdf`);
    } catch (e) {
      console.error('Failed to generate student PDF');
    }
  };

  const getCardIdFromCategory = (category) => {
    const card = CATEGORY_CARDS.find(c => c.title === category);
    return card?.id || null;
  };

  const buildInsights = (rows) => {
    const byCategory = new Map();
    let correct = 0;
    let total = 0;
    for (const r of rows) {
      const pct = Number.isFinite(r?.percentage) ? r.percentage : 0;
      const score = Number.isFinite(r?.score) ? r.score : 0;
      const t = Number.isFinite(r?.total) ? r.total : 0;
      const category = r?.quizId?.category || 'General';
      correct += score;
      total += t;
      const prev = byCategory.get(category) || { category, attempts: 0, sumPct: 0, avgPct: 0 };
      prev.attempts += 1;
      prev.sumPct += pct;
      prev.avgPct = Math.round(prev.sumPct / prev.attempts);
      byCategory.set(category, prev);
    }
    const perCategory = Array.from(byCategory.values()).sort((a, b) => b.avgPct - a.avgPct);
    return {
      barData: perCategory.map((c) => ({ category: c.category, score: c.avgPct })),
      accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
      pieData: [
        { name: 'Correct', value: Math.max(0, correct) },
        { name: 'Incorrect', value: Math.max(0, total - correct) },
      ],
      weakAreas: perCategory.filter(c => c.avgPct < 60).sort((a, b) => a.avgPct - b.avgPct).slice(0, 6),
      totalQuestions: total,
      totalCorrect: correct,
    };
  };

  const visibleQuizzes = quizzes.filter(q => CATEGORY_TITLES.includes(q.category) && !REMOVED_CATEGORIES.includes(q.category || 'General'));
  const visibleResults = results.filter(r => CATEGORY_TITLES.includes(r.quizId?.category) && !REMOVED_CATEGORIES.includes(r.quizId?.category || 'General'));
  const quizzesByCard = useMemo(() => {
    const grouped = {};
    for (const card of CATEGORY_CARDS) grouped[card.id] = [];
    visibleQuizzes.forEach((q) => {
      const id = getCardIdFromCategory(q.category);
      if (id) grouped[id]?.push(q);
    });
    return grouped;
  }, [visibleQuizzes]);
  const resultsByCard = useMemo(() => {
    const grouped = {};
    for (const card of CATEGORY_CARDS) grouped[card.id] = [];
    visibleResults.forEach((r) => {
      const id = getCardIdFromCategory(r.quizId?.category);
      if (id) grouped[id]?.push(r);
    });
    return grouped;
  }, [visibleResults]);
  const activeCard = selectedCard === 'All' ? null : CATEGORY_CARDS.find(c => c.id === selectedCard);
  const filteredQuizzes = activeCard ? (quizzesByCard[selectedCard] || []) : [];
  const filteredResults = activeCard ? (resultsByCard[selectedCard] || []) : [];
  const overallResults = visibleResults;
  const overallInsights = useMemo(() => buildInsights(overallResults), [overallResults]);
  const categoryInsights = useMemo(() => buildInsights(filteredResults), [filteredResults]);
  const pastReviewOverlay =
    pastReviewLoading || pastReview ? (
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-10 sm:pt-16 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Quiz answer review"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-3xl w-full p-6 sm:p-8 mb-12">
          {pastReviewLoading ? (
            <p className="text-center text-gray-500 py-8">Loading answers…</p>
          ) : pastReview?.error ? (
            <p className="text-center text-red-600 py-4">{pastReview.error}</p>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{pastReview.quizTitle}</h2>
              <p className="text-gray-500 mb-6">
                Score {pastReview.score}/{pastReview.total} ({pastReview.percentage}%)
              </p>
              {renderAnswerReview(pastReview.review, pastReview.submittedAt, {
                embedded: true,
              })}
            </>
          )}
          <button
            type="button"
            onClick={closePastReview}
            className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    ) : null;

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center"><div className="text-4xl mb-4">🧠</div><p className="text-gray-500">Loading quizzes...</p></div>
    </div>
  );

  // Quiz Result Screen
  if (quizResult) return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-6xl mb-4">{quizResult.percentage >= 60 ? '🎉' : '😔'}</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
        <p className="text-gray-500 mb-6">Here are your results</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="text-3xl font-bold text-blue-800">{quizResult.score}</div>
            <div className="text-blue-600 text-sm mt-1">Correct</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="text-3xl font-bold text-gray-800">{quizResult.total}</div>
            <div className="text-gray-500 text-sm mt-1">Total</div>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4">
            <div className={`text-3xl font-bold ${getGrade(quizResult.percentage).color}`}>
              {getGrade(quizResult.percentage).label}
            </div>
            <div className="text-orange-600 text-sm mt-1">Grade</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Score</span>
            <span>{quizResult.percentage}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${quizResult.percentage}%`,
                background: 'linear-gradient(135deg, #1e3a8a, #ea580c)'
              }}
            ></div>
          </div>
        </div>

        <p className="text-gray-500 mb-6">
          {quizResult.percentage >= 80 ? '🌟 Excellent work! Keep it up!' :
           quizResult.percentage >= 60 ? '👍 Good job! Practice more to improve!' :
           '💪 Keep practicing! You can do better!'}
        </p>

        {renderAnswerReview(quizResult.review)}

        <div className="flex gap-3 mt-8">
          <button onClick={() => setQuizResult(null)}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
            Back
          </button>
          <button onClick={() => setQuizResult(null)}
            className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-orange-600 text-white rounded-xl font-bold transition-all">
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  // Active Quiz Screen
  if (activeQuiz) return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Quiz Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{activeQuiz.title}</h1>
          <p className="text-gray-500 text-sm">{Object.keys(answers).length} of {activeQuiz.questions.length} answered</p>
        </div>
        <div className={`text-2xl font-bold px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-800'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${(Object.keys(answers).length / activeQuiz.questions.length) * 100}%`, background: 'linear-gradient(135deg, #1e3a8a, #ea580c)' }}>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {activeQuiz.questions.map((q, qi) => (
          <div key={qi} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-orange-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {qi + 1}
              </span>
              <p className="font-semibold text-gray-800 text-base">{q.question}</p>
            </div>
            <div className="space-y-2 ml-11">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    answers[qi] === oi
                      ? 'border-blue-800 bg-blue-50 text-blue-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-6 flex gap-3">
        <button onClick={() => { setActiveQuiz(null); setTimeLeft(null); }}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50">
          {submitting ? '⏳ Submitting...' : `Submit Quiz (${Object.keys(answers).length}/${activeQuiz.questions.length} answered)`}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {pastReviewOverlay}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🧠 Quizzes</h1>
          <p className="text-gray-500 mt-1">Test your knowledge and track your progress</p>
        </div>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={downloadStudentPdf}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
          >
            📄 Download PDF
          </button>
        </div>

        {selectedCard === 'All' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {CATEGORY_CARDS.map((card) => {
                const cardQuizzes = quizzesByCard[card.id] || [];
                const cardResults = resultsByCard[card.id] || [];
                const cardAvg = cardResults.length
                  ? Math.round(cardResults.reduce((a, r) => a + r.percentage, 0) / cardResults.length)
                  : 0;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCard(card.id)}
                    className="group text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 border border-blue-900/20 bg-gradient-to-br from-[#001233] to-[#0b2a4a] hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-2xl">{card.icon}</p>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-blue-100 border border-white/10">
                        CATEGORY
                      </span>
                    </div>
                    <p className="font-bold text-white mt-2 group-hover:text-yellow-300 transition-colors">{card.title}</p>
                    <p className="text-xs text-blue-100/80 mt-1">{cardQuizzes.length} quizzes</p>
                    <p className="text-xs text-blue-100/80">{cardResults.length} attempts · Avg {cardAvg}%</p>
                  </button>
                );
              })}
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Overall Results</h3>
            {overallResults.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Results Yet</h3>
                <p className="text-gray-500">Attempt quizzes to see overall performance.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-blue-800">{overallResults.length}</div>
                    <div className="text-gray-500 text-sm mt-1">Quizzes Taken</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {Math.round(overallResults.reduce((a, r) => a + r.percentage, 0) / overallResults.length)}%
                    </div>
                    <div className="text-gray-500 text-sm mt-1">Average Score</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {overallResults.filter(r => r.percentage >= 60).length}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">Passed</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Scores</p>
                    <div style={{ width: '100%', height: 240 }}>
                      <ResponsiveContainer>
                        <BarChart data={overallInsights.barData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                          <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} height={60} />
                          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(v) => [`${v}%`, 'Avg score']} />
                          <Bar dataKey="score" radius={[10, 10, 0, 0]} fill="#1e3a8a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Accuracy</p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-[120px]">
                        <p className="text-3xl font-extrabold text-gray-800">{overallInsights.accuracyPct}%</p>
                        <p className="text-xs text-gray-500 mt-1">{overallInsights.totalCorrect}/{overallInsights.totalQuestions} correct</p>
                      </div>
                      <div style={{ width: 180, height: 180 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={overallInsights.pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3}>
                              {overallInsights.pieData.map((_, idx) => (
                                <Cell key={idx} fill={idx === 0 ? '#16a34a' : '#ef4444'} />
                              ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Weak areas</p>
                    {overallInsights.weakAreas.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-sm font-semibold text-green-700">No weak areas found</p>
                        <p className="text-xs text-gray-500 mt-1">You are at 60%+ in all attempted quizzes</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {overallInsights.weakAreas.map((w) => (
                          <div key={w.category} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{w.category}</p>
                              <p className="text-xs text-gray-500">{w.attempts} attempt{w.attempts === 1 ? '' : 's'}</p>
                            </div>
                            <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700">
                              {w.avgPct}% ❌
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{activeCard?.icon} {activeCard?.title}</h2>
                <p className="text-sm text-gray-500">Quizzes and results</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard('All')}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
              >
                ← Back to Categories
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Available</p>
                <p className="text-2xl font-bold text-blue-800 mt-2">{filteredQuizzes.length}</p>
                <p className="text-xs text-gray-500">Quizzes</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Attempts</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{filteredResults.length}</p>
                <p className="text-xs text-gray-500">My attempts</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Passed</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{filteredResults.filter(r => r.percentage >= 60).length}</p>
                <p className="text-xs text-gray-500">Within this category</p>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">📝 Quizzes in {activeCard?.title}</h3>
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Quizzes Available</h3>
                <p className="text-gray-500">No quizzes yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredQuizzes.map(quiz => {
                  const myResult = filteredResults.find(r => r.quizId?._id === quiz._id);
                  return (
                    <div key={quiz._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
                      <div className="h-3 bg-gradient-to-r from-blue-800 to-orange-600"></div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                              {quiz.category || 'General'}
                            </span>
                          </div>
                          {myResult && (
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${myResult.percentage >= 60 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {myResult.percentage}%
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg mb-2">{quiz.title}</h3>
                        {quiz.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{quiz.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                          <span>❓ {quiz.questions?.length || 0} questions</span>
                          <span>⏱ {quiz.timeLimit || 30} mins</span>
                        </div>
                        <button onClick={() => startQuiz(quiz)}
                          className="w-full py-2.5 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                          {myResult ? '🔄 Retake Quiz' : '▶ Start Quiz'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-800 mt-8 mb-3">📊 Results in {activeCard?.title}</h3>
            {filteredResults.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No Results Yet</h3>
                <p className="text-gray-500">Take a quiz to see results.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-blue-800">{filteredResults.length}</div>
                    <div className="text-gray-500 text-sm mt-1">Quizzes Taken</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {Math.round(filteredResults.reduce((a, r) => a + r.percentage, 0) / filteredResults.length)}%
                    </div>
                    <div className="text-gray-500 text-sm mt-1">Average Score</div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {filteredResults.filter(r => r.percentage >= 60).length}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">Passed</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Scores per category</p>
                    <div style={{ width: '100%', height: 240 }}>
                      <ResponsiveContainer>
                        <BarChart data={categoryInsights.barData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                          <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} height={60} />
                          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(v) => [`${v}%`, 'Avg score']} />
                          <Bar dataKey="score" radius={[10, 10, 0, 0]} fill="#1e3a8a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Accuracy</p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-[120px]">
                        <p className="text-3xl font-extrabold text-gray-800">{categoryInsights.accuracyPct}%</p>
                        <p className="text-xs text-gray-500 mt-1">{categoryInsights.totalCorrect}/{categoryInsights.totalQuestions} correct</p>
                      </div>
                      <div style={{ width: 180, height: 180 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={categoryInsights.pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3}>
                              {categoryInsights.pieData.map((_, idx) => (
                                <Cell key={idx} fill={idx === 0 ? '#16a34a' : '#ef4444'} />
                              ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Weak areas</p>
                    {categoryInsights.weakAreas.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-sm font-semibold text-green-700">No weak areas found</p>
                        <p className="text-xs text-gray-500 mt-1">You are at 60%+ in all attempted categories.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categoryInsights.weakAreas.map((w) => (
                          <div key={w.category} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{w.category}</p>
                              <p className="text-xs text-gray-500">{w.attempts} attempt{w.attempts === 1 ? '' : 's'}</p>
                            </div>
                            <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${w.avgPct >= 60 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {w.avgPct}% {w.avgPct >= 60 ? '✅' : '❌'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Quiz</th>
                        <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Score</th>
                        <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                        <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Answers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredResults.map((result, i) => {
                        const grade = getGrade(result.percentage);
                        return (
                          <tr key={result._id || i} className="hover:bg-gray-50 transition-all">
                            <td className="py-3 px-5">
                              <p className="font-semibold text-gray-800">{result.quizId?.title || 'Unknown Quiz'}</p>
                              <p className="text-gray-400 text-xs">{result.quizId?.category || 'General'}</p>
                            </td>
                            <td className="py-3 px-5 text-center">
                              <span className="font-bold text-gray-800">{result.score}/{result.total}</span>
                              <p className="text-gray-400 text-xs">{result.percentage}%</p>
                            </td>
                            <td className="py-3 px-5 text-center">
                              <span className={`text-xl font-bold ${grade.color}`}>{grade.label}</span>
                            </td>
                            <td className="py-3 px-5 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.percentage >= 60 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {result.percentage >= 60 ? '✅ Passed' : '❌ Failed'}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-gray-500 text-sm">
                              {new Date(result.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-5 text-center">
                              <button
                                type="button"
                                onClick={() => fetchPastReview(result._id)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 transition-all"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {showIdentityModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-100 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Enter Identity for Quiz Attempts</h3>
            <p className="text-sm text-gray-500 mb-4">This will be visible in admin results.</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Student Name"
                value={identity.studentName}
                onChange={(e) => {
                  setIdentityError('');
                  setIdentity((p) => ({ ...p, studentName: e.target.value }));
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="IT Number (e.g. IT20230001)"
                value={identity.studentItNumber}
                onChange={(e) => {
                  setIdentityError('');
                  setIdentity((p) => ({ ...p, studentItNumber: e.target.value }));
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {identityError && (
                <p className="text-xs text-red-600">{identityError}</p>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setShowIdentityModal(false); setPendingQuiz(null); }} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold">
                Cancel
              </button>
              <button onClick={confirmIdentityAndStart} className="flex-1 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold">
                Save & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}