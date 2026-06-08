
import { useState, useEffect } from 'react';
import { createMaterial } from '../../services/api';

const STUDY_API = 'http://localhost:5003/api/study-materials';

export default function UploadMaterial() {
  const [form, setForm] = useState({
    title: '', description: '', category: '', fileUrl: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentMaterials, setRecentMaterials] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manage'
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [descriptionError, setDescriptionError] = useState(''); // ← new: inline description error
  const token = localStorage.getItem('token');

  const categories = [
    { value: 'frontend', label: '🎨 Frontend' },
    { value: 'backend', label: '⚙️ Backend' },
    { value: 'database', label: '🗄️ Database' },
    { value: 'uiux', label: '✏️ UI/UX Design' },
    { value: 'other', label: '📦 Other' }
  ];

  const categoryColor = (cat) => {
    const colors = {
      frontend: 'bg-blue-100 text-blue-700',
      backend: 'bg-green-100 text-green-700',
      database: 'bg-yellow-100 text-yellow-700',
      uiux: 'bg-purple-100 text-purple-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[cat] || 'bg-gray-100 text-gray-700';
  };

  // ── Add Notification to localStorage with REAL database ID ──
  const addNotification = (material) => {
    const notifications = JSON.parse(localStorage.getItem('studyMaterialNotifications') || '[]');
    
    const newNotification = {
      id: Date.now(),
      title: '📚 New Study Material Available!',
      message: `"${material.title}" has been added to ${material.category} category. Click to view!`,
      materialId: material._id,  // This is the REAL database ID
      materialTitle: material.title,
      category: material.category,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.unshift(newNotification);
    // Keep only last 20 notifications
    if (notifications.length > 20) notifications.pop();
    localStorage.setItem('studyMaterialNotifications', JSON.stringify(notifications));
    
    // Trigger event for real-time update
    window.dispatchEvent(new CustomEvent('newMaterialAdded', { detail: newNotification }));
    
    console.log('✅ Notification saved with REAL ID:', material._id);
  };

  // ── Description validator ──────────────────────────────────────────────────
  const validateDescription = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Description is required. Please describe what students will learn.';
    }

    // Must be at least 10 characters
    if (trimmed.length < 10) {
      return 'Description must be at least 10 characters long.';
    }

    // Cannot be only numbers (e.g. "12345")
    if (/^\d+$/.test(trimmed)) {
      return 'Description cannot contain only numbers. Please enter meaningful text.';
    }

    // Count how many characters are actual letters (a-z, A-Z, unicode letters)
    const letterMatches = trimmed.match(/[a-zA-Z\u00C0-\u024F]/g) || [];
    const letterRatio = letterMatches.length / trimmed.length;

    // Require at least 50% of the characters to be real letters
    if (letterRatio < 0.5) {
      return 'Description must contain meaningful text, not mainly numbers or symbols.';
    }

    // Must contain at least one complete word (2+ letters in a row)
    if (!/[a-zA-Z]{2,}/.test(trimmed)) {
      return 'Description must include at least one recognizable word.';
    }

    return ''; // ✅ valid
  };
  // ──────────────────────────────────────────────────────────────────────────

  const fetchMaterials = async () => {
    try {
      const res = await fetch(STUDY_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // Sort by createdAt date (newest first)
      const sortedData = [...data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setAllMaterials(sortedData);
      setRecentMaterials(sortedData.slice(0, 5));
      return sortedData;
    } catch (err) {
      console.error('Failed to fetch materials');
      return [];
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Live validation as the user types in the description field
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, description: value });
    if (value.trim()) {
      setDescriptionError(validateDescription(value));
    } else {
      setDescriptionError(''); // don't show error on empty until submit
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ── Title validation ──
    const onlyNumbers = /^\d+$/.test(form.title.trim());
    if (onlyNumbers) {
      setError('Title cannot contain only numbers. Please enter a valid title.');
      return;
    }
    if (form.title.trim().length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }

    // ── Description validation ──
    const descErr = validateDescription(form.description);
    if (descErr) {
      setDescriptionError(descErr);
      setError(descErr);
      return;
    }

    setLoading(true);
    setSuccess('');
    try {
      if (editingId) {
        const res = await fetch(`${STUDY_API}/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Failed to update');
        setSuccess('Material updated successfully!');
        setEditingId(null);
      } else {
        // Step 1: Create the material using the API function
        await createMaterial(form);
        
        // Step 2: Fetch ALL materials
        const fetchRes = await fetch(STUDY_API, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allMaterialsList = await fetchRes.json();
        
        // Step 3: Sort by createdAt (newest first) and get the first one
        const sortedMaterials = [...allMaterialsList].sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        const newMaterial = sortedMaterials[0];
        
        console.log('📦 New material added:', newMaterial.title);
        console.log('📦 New material ID:', newMaterial._id);
        console.log('📦 Created at:', newMaterial.createdAt);
        
        // Step 4: Send notification with the REAL database ID
        if (newMaterial && newMaterial._id) {
          addNotification({ ...form, _id: newMaterial._id, createdAt: newMaterial.createdAt });
        } else {
          console.error('❌ Failed to get new material ID');
        }
        
        setSuccess('Material uploaded successfully!');
      }
      setForm({ title: '', description: '', category: '', fileUrl: '' });
      setDescriptionError('');
      fetchMaterials();
      setActiveTab('manage');
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save material');
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    }
  };

  const handleEdit = (material) => {
    setForm({
      title: material.title,
      description: material.description || '',
      category: material.category,
      fileUrl: material.fileUrl
    });
    setEditingId(material._id);
    setDescriptionError('');
    setActiveTab('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescriptionError('');
    setForm({ title: '', description: '', category: '', fileUrl: '' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${STUDY_API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Material deleted successfully!');
      setDeleteConfirm(null);
      fetchMaterials();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete material.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDisplayDate = (m) => {
    const isEdited = m.updatedAt && m.updatedAt !== m.createdAt;
    return (
      <div>
        <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(isEdited ? m.updatedAt : m.createdAt)}</p>
        {isEdited && <p className="text-xs text-blue-400 font-medium">✏️ edited</p>}
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📚 Study Material Management</h1>
        <p className="text-gray-500 mt-1">Upload, edit and manage study materials for students.</p>
      </div>

      {/* Global Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
          ❌ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'upload'
              ? 'bg-gray-900 text-white shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {editingId ? '✏️ Edit Material' : '⬆️ Upload'}
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'manage'
              ? 'bg-gray-900 text-white shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Manage ({allMaterials.length})
        </button>
      </div>

      {/* ── UPLOAD / EDIT TAB ── */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            {editingId && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-5 flex items-center justify-between text-sm">
                <span>✏️ You are editing an existing material</span>
                <button
                  onClick={handleCancelEdit}
                  className="text-blue-400 hover:text-blue-700 font-semibold ml-4"
                >
                  ✕ Cancel Edit
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="e.g. React.js Fundamentals"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File URL</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/... or https://example.com/material.pdf"
                  value={form.fileUrl}
                  onChange={e => setForm({ ...form, fileUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              {/* ── Description field with live validation ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe what students will learn from this material..."
                  value={form.description}
                  onChange={handleDescriptionChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-sm resize-none transition-colors ${
                    descriptionError
                      ? 'border-red-400 bg-red-50 focus:ring-red-400'
                      : form.description.trim() && !descriptionError
                      ? 'border-green-400 bg-green-50 focus:ring-green-400'
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                />

                {/* Inline feedback messages */}
                {descriptionError ? (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    ❌ {descriptionError}
                  </p>
                ) : form.description.trim() ? (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    ✅ Looks good!
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    ⚠️ Description is required — only meaningful text is allowed (no numbers only)
                  </p>
                )}
              </div>
              {/* ─────────────────────────────────────────── */}

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg ${
                  editingId
                    ? 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                    : 'bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {editingId ? 'Updating...' : 'Uploading...'}
                  </span>
                ) : editingId ? '💾 Update Material' : '📤 Upload Material'}
              </button>
            </form>
          </div>

          {/* Recently Uploaded sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Recently Uploaded</h2>
            <p className="text-gray-400 text-sm mb-5">Last 5 materials added</p>
            {recentMaterials.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📚</div>
                <p className="text-sm">No materials yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMaterials.map((m, index) => (
                  <div key={m._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{m.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        🕒 {formatDate(m.updatedAt && m.updatedAt !== m.createdAt ? m.updatedAt : m.createdAt)}
                      </p>
                      {m.updatedAt && m.updatedAt !== m.createdAt && (
                        <p className="text-blue-400 text-xs font-medium">✏️ edited</p>
                      )}
                    </div>
                    <span className="w-2 h-2 bg-orange-400 rounded-full shrink-0"></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MANAGE TAB ── */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">All Study Materials</h2>
              <p className="text-gray-400 text-sm">{allMaterials.length} materials total</p>
            </div>
            <button
              onClick={() => { handleCancelEdit(); setActiveTab('upload'); }}
              className="bg-gradient-to-r from-blue-800 to-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all"
            >
              + Add New
            </button>
          </div>

          {allMaterials.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-semibold text-gray-500">No materials uploaded yet</p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-4 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all"
              >
                Upload First Material
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allMaterials.map((m, i) => (
                    <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-400 font-semibold">{i + 1}</td>
                      <td className="px-5 py-4">
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                        >
                          {m.title}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${categoryColor(m.category)}`}>
                          {categories.find(c => c.value === m.category)?.label || m.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 max-w-xs">
                        <p className="line-clamp-2">
                          {m.description || <span className="text-gray-300 italic">No description</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {getDisplayDate(m)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(m)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-all"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(m._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-all"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Material</h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to delete this material? This action{' '}
                <span className="font-semibold text-red-500">cannot be undone</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
