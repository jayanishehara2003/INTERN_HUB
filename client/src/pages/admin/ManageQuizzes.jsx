import { useMemo, useState, useEffect } from 'react';
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
const CATEGORY_CARDS = [
  { id: 'software', icon: '💻', title: 'Software Engineering' },
  { id: 'networking', icon: '🌐', title: 'Networking & Infrastructure' },
  { id: 'database', icon: '🗄️', title: 'Database & Data Management' },
  { id: 'cybersecurity', icon: '🔐', title: 'Cybersecurity' },
  { id: 'ai-ml', icon: '🤖', title: 'Artificial Intelligence & Machine Learning' },
  { id: 'cloud-devops', icon: '☁️', title: 'Cloud Computing & DevOps' },
];
const CATEGORY_TITLES = CATEGORY_CARDS.map((c) => c.title);

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('manage');
  const [selectedCard, setSelectedCard] = useState('All');
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORY_CARDS[0].title,
    timeLimit: 30,
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
  });
  const token = localStorage.getItem('token');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [quizRes, resultRes] = await Promise.all([
        fetch(QUIZ_API, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${QUIZ_API}/results/all`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const quizData = await quizRes.json();
      const resultData = await resultRes.json();
      setQuizzes(Array.isArray(quizData) ? quizData : []);
      setResults(Array.isArray(resultData) ? resultData : []);
    } catch (err) { console.error('Failed to fetch'); }
    finally { setLoading(false); }
  };

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'A+', color: 'text-green-600' };
    if (pct >= 80) return { label: 'A', color: 'text-green-500' };
    if (pct >= 70) return { label: 'B', color: 'text-blue-600' };
    if (pct >= 60) return { label: 'C', color: 'text-yellow-600' };
    return { label: 'F', color: 'text-red-600' };
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const selectedCardDef = selectedCard === 'All' ? null : CATEGORY_CARDS.find(c => c.id === selectedCard);
  const validQuizzes = useMemo(
    () => quizzes.filter((q) => CATEGORY_TITLES.includes(q.category)),
    [quizzes]
  );
  const validResults = useMemo(
    () => results.filter((r) => CATEGORY_TITLES.includes(r.quizId?.category)),
    [results]
  );
  const quizzesByCategory = useMemo(() => {
    const grouped = {};
    CATEGORY_CARDS.forEach(c => { grouped[c.title] = []; });
    validQuizzes.forEach((q) => {
      if (grouped[q.category]) grouped[q.category].push(q);
    });
    return grouped;
  }, [validQuizzes]);
  const filteredResults = selectedCardDef
    ? validResults.filter(r => (r.quizId?.category || 'General') === selectedCardDef.title)
    : validResults;

  const insights = useMemo(() => {
    const byCategory = new Map();
    const byStudent = new Map();
    let correct = 0;
    let total = 0;

    for (const r of validResults) {
      const pct = Number.isFinite(r?.percentage) ? r.percentage : 0;
      const score = Number.isFinite(r?.score) ? r.score : 0;
      const t = Number.isFinite(r?.total) ? r.total : 0;
      const category = r?.quizId?.category || 'General';
      const student = r?.studentName || 'Unknown';
      correct += score;
      total += t;

      const c = byCategory.get(category) || { category, attempts: 0, sumPct: 0, avgPct: 0 };
      c.attempts += 1;
      c.sumPct += pct;
      c.avgPct = Math.round(c.sumPct / c.attempts);
      byCategory.set(category, c);

      const s = byStudent.get(student) || { student, attempts: 0, sumPct: 0, avgPct: 0 };
      s.attempts += 1;
      s.sumPct += pct;
      s.avgPct = Math.round(s.sumPct / s.attempts);
      byStudent.set(student, s);
    }

    const perCategory = Array.from(byCategory.values()).sort((a, b) => b.avgPct - a.avgPct);
    const topPerformer = Array.from(byStudent.values()).sort((a, b) => b.avgPct - a.avgPct)[0] || null;
    const mostAttemptedCategory = perCategory.slice().sort((a, b) => b.attempts - a.attempts)[0] || null;

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
      topPerformer,
      mostAttemptedCategory,
    };
  }, [validResults]);

  const studentPerformance = useMemo(() => {
    const map = new Map();
    for (const r of validResults) {
      const key = r.studentId || r.studentName || 'unknown';
      const row = map.get(key) || {
        studentId: r.studentId || '-',
        studentName: r.studentName || 'Unknown',
        studentItNumber: r.studentItNumber || '-',
        attempts: 0,
        passed: 0,
        totalPct: 0,
        byCategory: {},
      };
      row.attempts += 1;
      row.totalPct += r.percentage || 0;
      if ((r.percentage || 0) >= 60) row.passed += 1;
      const cat = r.quizId?.category || 'Unknown';
      const catRow = row.byCategory[cat] || { attempts: 0, totalPct: 0 };
      catRow.attempts += 1;
      catRow.totalPct += r.percentage || 0;
      row.byCategory[cat] = catRow;
      map.set(key, row);
    }
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        avgPct: Math.round(r.totalPct / Math.max(1, r.attempts)),
        passRate: Math.round((r.passed / Math.max(1, r.attempts)) * 100),
      }))
      .sort((a, b) => b.avgPct - a.avgPct);
  }, [validResults]);

  const addQuestion = () => setForm(prev => ({
    ...prev,
    questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  }));

  const removeQuestion = (i) => setForm(prev => ({
    ...prev,
    questions: prev.questions.filter((_, idx) => idx !== i)
  }));

  const updateQuestion = (qi, field, value) => {
    const updated = [...form.questions];
    updated[qi][field] = value;
    setForm(prev => ({ ...prev, questions: updated }));
  };

  const updateOption = (qi, oi, value) => {
    const updated = [...form.questions];
    updated[qi].options[oi] = value;
    setForm(prev => ({ ...prev, questions: updated }));
  };

  const handleSave = async () => {
    if (!selectedCardDef) {
      setError('Please select a category card first.');
      return;
    }
    if (!form.title || form.questions.some(q => !q.question || q.options.some(o => !o))) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const isEditing = Boolean(editingQuizId);
      const res = await fetch(isEditing ? `${QUIZ_API}/${editingQuizId}` : QUIZ_API, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, category: selectedCardDef.title })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(isEditing ? 'Quiz updated successfully!' : 'Quiz created successfully!');
        setEditingQuizId(null);
        setForm({
          title: '',
          description: '',
          category: selectedCardDef?.title || CATEGORY_CARDS[0].title,
          timeLimit: 30,
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
        });
        fetchData();
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError(data?.message || 'Failed to save quiz.');
      }
    } catch (err) {
      console.error('Failed to save quiz');
      setError('Network error while saving quiz.');
    }
    finally { setSaving(false); }
  };

  const handleEditQuiz = async (quizId) => {
    setError('');
    try {
      const res = await fetch(`${QUIZ_API}/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to load quiz for editing.');
        return;
      }
      setEditingQuizId(quizId);
      setForm({
        title: data.title || '',
        description: data.description || '',
        category: data.category || selectedCardDef?.title || CATEGORY_CARDS[0].title,
        timeLimit: data.timeLimit || 30,
        questions: (data.questions || []).map((q) => ({
          question: q.question || '',
          options: q.options?.length ? q.options : ['', '', '', ''],
          correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0,
        })),
      });
    } catch (err) {
      console.error('Failed to load quiz');
      setError('Network error while loading quiz.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const ok = window.confirm('Delete this quiz? This action cannot be undone.');
    if (!ok) return;
    setError('');
    try {
      const res = await fetch(`${QUIZ_API}/${quizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to delete quiz.');
        return;
      }
      setSuccess('Quiz removed successfully!');
      if (editingQuizId === quizId) {
        setEditingQuizId(null);
        setForm({
          title: '',
          description: '',
          category: selectedCardDef?.title || CATEGORY_CARDS[0].title,
          timeLimit: 30,
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
        });
      }
      fetchData();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Failed to delete quiz');
      setError('Network error while deleting quiz.');
    }
  };

  const downloadAdminResultsPdf = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let y = 14;
      pdf.setFontSize(14);
      pdf.text('Admin Quiz Results Report', 12, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 12, y);
      y += 7;
      pdf.text(`Total Attempts: ${validResults.length}`, 12, y); y += 6;
      pdf.text(`Overall Accuracy: ${insights.accuracyPct}%`, 12, y); y += 8;
      pdf.text('Recent Attempts:', 12, y); y += 6;
      validResults.slice(0, 25).forEach((r, i) => {
        const line = `${i + 1}. ${r.studentName || 'Unknown'} (${r.studentItNumber || '-'}) | ${r.quizId?.title || 'Quiz'} | ${r.percentage}%`;
        pdf.text(line.slice(0, 115), 12, y);
        y += 5;
        if (y > 280) { pdf.addPage(); y = 12; }
      });
      pdf.save('admin-quiz-results.pdf');
    } catch (e) {
      setError('Failed to generate PDF.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center"><div className="text-4xl mb-4">🧠</div><p className="text-gray-500">Loading...</p></div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🧠 Manage Quizzes</h1>
          <p className="text-gray-500 mt-1">Create quizzes and monitor outcomes</p>
        </div>
        <div className="flex items-center gap-2">
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm">✅ {success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">❌ {error}</div>}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === 'manage' ? 'bg-blue-800 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
        >
          Quizzes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === 'results' ? 'bg-blue-800 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
        >
          Student Results
        </button>
      </div>

      {activeTab === 'manage' ? (
        <>
          {!selectedCardDef ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {CATEGORY_CARDS.map(card => {
                const count = (quizzesByCategory[card.title] || []).length;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setSelectedCard(card.id);
                      setEditingQuizId(null);
                      setError('');
                      setForm({
                        title: '',
                        description: '',
                        category: card.title,
                        timeLimit: 30,
                        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
                      });
                    }}
                    className="text-left rounded-2xl border p-5 transition-all border-gray-100 bg-white hover:shadow-sm"
                  >
                    <p className="text-2xl">{card.icon}</p>
                    <p className="font-bold text-gray-800 mt-2">{card.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{count} quizzes</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mb-6">
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => { setSelectedCard('All'); setEditingQuizId(null); setError(''); }}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
                >
                  ← Back
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingQuizId ? `✏️ Update Quiz in ${selectedCardDef.title}` : `➕ Create New Quiz in ${selectedCardDef.title}`}
                </h2>
                {editingQuizId && (
                  <button
                    onClick={() => {
                      setEditingQuizId(null);
                      setError('');
                      setForm({
                        title: '',
                        description: '',
                        category: selectedCardDef.title,
                        timeLimit: 30,
                        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. JavaScript Basics"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input value={form.category} readOnly className={`${inputCls} bg-gray-50`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      placeholder="Brief description..."
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={form.timeLimit}
                      onChange={e => setForm(p => ({ ...p, timeLimit: parseInt(e.target.value, 10) || 30 }))}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-gray-700 mb-4">Questions</h3>
              <div className="space-y-5">
                {form.questions.map((q, qi) => (
                  <div key={qi} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                        {qi + 1}
                      </span>
                      {form.questions.length > 1 && (
                        <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600 text-sm font-medium">
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your question..."
                      value={q.question}
                      onChange={e => updateQuestion(qi, 'question', e.target.value)}
                      className={`${inputCls} mb-3`}
                    />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correctAnswer === oi}
                            onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                            className="shrink-0 accent-blue-800"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            value={opt}
                            onChange={e => updateOption(qi, oi, e.target.value)}
                            className={`${inputCls} ${q.correctAnswer === oi ? 'border-green-400 bg-green-50' : ''}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={addQuestion} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-all">
                  ➕ Add Question
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-blue-800 to-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50">
                  {saving ? '⏳ Saving...' : (editingQuizId ? '💾 Update Quiz' : '💾 Save Quiz')}
                </button>
              </div>
          </div>
            </div>
          )}

          {selectedCardDef && (
            <>
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            📝 Created Quizzes in {selectedCardDef.title}
          </h3>
          {(quizzesByCategory[selectedCardDef.title] || []).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 mb-8">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-gray-500">No quizzes created in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {(quizzesByCategory[selectedCardDef.title] || []).map((quiz) => (
                <div
                  key={quiz._id}
                  className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="h-3 bg-gradient-to-r from-indigo-700 to-purple-600"></div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                          Admin Quiz
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          {quiz.category || 'General'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">{quiz.title}</h3>
                    {quiz.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{quiz.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      <span>❓ {quiz.questions?.length || 0} questions</span>
                      <span>⏱ {quiz.timeLimit || 30} mins</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditQuiz(quiz._id)}
                        className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-all"
                      >
                        ✏️ Update
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-bold transition-all"
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </>
      ) : (
        <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={downloadAdminResultsPdf}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold"
        >
          📄 Download Results PDF
        </button>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mt-2 mb-3">📊 Student Results</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div className="text-3xl font-bold text-blue-800">{validResults.length}</div>
          <div className="text-gray-500 text-sm mt-1">Total Attempts</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div className="text-3xl font-bold text-green-600">
            {validResults.filter(r => r.percentage >= 60).length}
          </div>
          <div className="text-gray-500 text-sm mt-1">Passed</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {validResults.length > 0 ? Math.round(validResults.reduce((a, r) => a + r.percentage, 0) / validResults.length) : 0}%
          </div>
          <div className="text-gray-500 text-sm mt-1">Average Score</div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Scores per category (avg)</p>
          {insights.barData.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No attempts yet.</p>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={insights.barData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                  <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} height={60} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Avg score']} />
                  <Bar dataKey="score" radius={[10, 10, 0, 0]} fill="#1e3a8a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Accuracy (overall)</p>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-[120px]">
              <p className="text-3xl font-extrabold text-gray-800">{insights.accuracyPct}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {insights.totalCorrect}/{insights.totalQuestions} correct
              </p>
            </div>
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={insights.pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {insights.pieData.map((_, idx) => (
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
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Weak areas (avg &lt; 60%)</p>
          {insights.weakAreas.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-green-700">No weak areas found</p>
              <p className="text-xs text-gray-500 mt-1">Across attempted categories, avg is 60%+.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.weakAreas.map((w) => (
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
              <p className="text-xs text-gray-500 mt-2">
                Tip: add more quizzes in these categories and encourage retakes + answer review.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Top Performer</p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {insights.topPerformer ? insights.topPerformer.student : 'No data'}
          </p>
          <p className="text-xs text-gray-500">
            {insights.topPerformer ? `${insights.topPerformer.avgPct}% avg across ${insights.topPerformer.attempts} attempts` : 'Awaiting attempts'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Most Attempted Category</p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {insights.mostAttemptedCategory ? insights.mostAttemptedCategory.category : 'No data'}
          </p>
          <p className="text-xs text-gray-500">
            {insights.mostAttemptedCategory ? `${insights.mostAttemptedCategory.attempts} attempts` : 'Awaiting attempts'}
          </p>
        </div>
      </div>

      <h4 className="text-md font-bold text-gray-800 mb-3">👥 Student Performance Summary</h4>
      {studentPerformance.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 mb-6">
          <p className="text-gray-500">No student attempts in the new categories yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">IT Number</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Attempts</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Avg</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Pass Rate</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">By Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {studentPerformance.map((s) => (
                <tr key={s.studentId} className="hover:bg-gray-50 transition-all">
                  <td className="py-3 px-5">
                    <p className="font-semibold text-gray-800 text-sm">{s.studentName}</p>
                    <p className="text-xs text-gray-400">{s.studentId}</p>
                  </td>
                  <td className="py-3 px-5 text-sm text-gray-700">{s.studentItNumber || '-'}</td>
                  <td className="py-3 px-5 text-center font-semibold text-gray-800">{s.attempts}</td>
                  <td className="py-3 px-5 text-center font-semibold text-gray-800">{s.avgPct}%</td>
                  <td className="py-3 px-5 text-center font-semibold text-gray-800">{s.passRate}%</td>
                  <td className="py-3 px-5">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(s.byCategory).map(([cat, c]) => (
                        <span key={cat} className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-800">
                          {cat}: {Math.round(c.totalPct / Math.max(1, c.attempts))}%
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {validResults.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500">No student results available yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">IT Number</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Quiz</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {validResults.map((result, i) => {
                const grade = getGrade(result.percentage);
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-all">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-800 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                          {result.studentName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{result.studentName || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      {result.studentItNumber || '-'}
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-gray-700 text-sm font-medium">{result.quizId?.title || 'Unknown'}</p>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}
    </div>
  );
}