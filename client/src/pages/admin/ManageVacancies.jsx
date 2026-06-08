import { useState, useEffect } from 'react';
import { updateVacancy, deleteVacancy } from '../../services/api';

const ADMIN_VACANCY_API = 'http://localhost:5002/api/vacancies/admin/all';

const stripCommas = (value = '') => value.replace(/,/g, '');

const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEditableSalaryValue = (salary) => {
  if (!salary) return '';
  const cleaned = String(salary).replace(/,/g, '').trim();
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? cleaned : '';
};

const validateSalary = (value) => {
  if (!value) return '';

  const cleanValue = stripCommas(value);
  const [integerPart = '', decimalPart] = cleanValue.split('.');

  if (!/^\d+(\.\d{0,2})?$/.test(cleanValue)) {
    return 'Salary must be a valid number';
  }

  if (integerPart.length < 4) {
    return 'Salary must contain at least 4 digits';
  }

  if (integerPart.length > 6) {
    return 'Salary cannot exceed 6 digits';
  }

  if (decimalPart && decimalPart.length > 2) {
    return 'Salary can have at most 2 decimal places';
  }

  return '';
};

const formatSalaryDisplay = (value, isFocused) => {
  if (!value) return '';

  const cleanValue = stripCommas(value);
  const hasDecimal = cleanValue.includes('.');
  const endsWithDot = cleanValue.endsWith('.');
  const [integerPart = '', decimalPart = ''] = cleanValue.split('.');

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (isFocused) {
    if (endsWithDot) return `${formattedInteger}.`;
    if (hasDecimal) return `${formattedInteger}.${decimalPart}`;
    return formattedInteger;
  }

  if (!hasDecimal) return `${formattedInteger}.00`;
  if (endsWithDot) return `${formattedInteger}.`;
  return `${formattedInteger}.${decimalPart}`;
};

const normalizeSalaryForSubmit = (value) => {
  if (!value) return '';

  const cleanValue = stripCommas(value);

  if (!cleanValue.includes('.')) {
    return `${cleanValue}.00`;
  }

  const [integerPart, decimalPart = ''] = cleanValue.split('.');

  if (decimalPart.length === 0) return `${integerPart}.00`;
  if (decimalPart.length === 1) return `${integerPart}.${decimalPart}0`;

  return cleanValue;
};

const isValidUrl = (value) => {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function ManageVacancies() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingVacancy, setEditingVacancy] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    deadline: '',
    skills: [],
    salary: '',
    jobType: 'Internship',
    applicationUrl: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [salaryFocused, setSalaryFocused] = useState(false);
  const [salaryTouched, setSalaryTouched] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVacancyId, setSelectedVacancyId] = useState(null);

  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchVacancies();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(vacancies.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [vacancies, currentPage, pageSize]);

  const isExpired = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const validateForm = (form) => {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = 'Job title is required';
    } else if (form.title.trim().length < 3) {
      errors.title = 'Job title must be at least 3 characters';
    }

    if (!form.company.trim()) {
      errors.company = 'Company name is required';
    } else if (form.company.trim().length < 2) {
      errors.company = 'Company name must be at least 2 characters';
    }

    if (!form.deadline) {
      errors.deadline = 'Deadline is required';
    } else {
      const selectedDate = new Date(`${form.deadline}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.deadline = 'Deadline cannot be in the past';
      }
    }

    if (form.description && form.description.trim() && form.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!Array.isArray(form.skills) || form.skills.length === 0) {
      errors.skills = 'At least one skill is required';
    }

    const salaryError = validateSalary(form.salary);
    if (salaryError) {
      errors.salary = salaryError;
    }

    if (!form.applicationUrl.trim()) {
      errors.applicationUrl = 'Application URL is required';
    } else if (!isValidUrl(form.applicationUrl.trim())) {
      errors.applicationUrl = 'Please enter a valid URL';
    }

    return errors;
  };

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(ADMIN_VACANCY_API, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch vacancies');
      }

      setVacancies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch vacancies error:', err);
      setError('Failed to fetch vacancies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedVacancyId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setDeletingId(selectedVacancyId);
      setError('');
      setSuccess('');

      await deleteVacancy(selectedVacancyId);

      setSuccess('Vacancy deleted successfully');
      setVacancies((prev) => prev.filter((v) => v._id !== selectedVacancyId));

      setShowDeleteModal(false);
      setSelectedVacancyId(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete vacancy error:', err);
      setError('Unable to delete the vacancy right now. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedVacancyId(null);
  };

  const openEditModal = (vacancy) => {
    setEditingVacancy(vacancy);
    setFieldErrors({});
    setSalaryFocused(false);
    setSalaryTouched(false);

    setEditForm({
      title: vacancy.title || '',
      company: vacancy.company || '',
      description: vacancy.description || '',
      location: vacancy.location || '',
      deadline: formatDateForInput(vacancy.deadline),
      skills: vacancy.skills || [],
      salary: getEditableSalaryValue(vacancy.salary),
      jobType: vacancy.jobType || 'Internship',
      applicationUrl: vacancy.applicationUrl || ''
    });
  };

  const closeEditModal = () => {
    setEditingVacancy(null);
    setFieldErrors({});
    setSalaryFocused(false);
    setSalaryTouched(false);
  };

  const handleFieldChange = (field, value) => {
    const updatedForm = {
      ...editForm,
      [field]: value
    };

    setEditForm(updatedForm);

    const errors = validateForm(updatedForm);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: errors[field] || ''
    }));
  };

  const handleSkillsChange = (value) => {
    const skillsArray = value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);

    const updatedForm = {
      ...editForm,
      skills: skillsArray
    };

    setEditForm(updatedForm);

    const errors = validateForm(updatedForm);
    setFieldErrors((prev) => ({
      ...prev,
      skills: errors.skills || ''
    }));
  };

  const handleSalaryChange = (e) => {
    let value = e.target.value;

    setSalaryTouched(true);

    value = stripCommas(value);
    value = value.replace(/[^\d.]/g, '');

    const firstDotIndex = value.indexOf('.');
    if (firstDotIndex !== -1) {
      value =
        value.slice(0, firstDotIndex + 1) +
        value.slice(firstDotIndex + 1).replace(/\./g, '');
    }

    const hasDot = value.includes('.');
    let [integerPart = '', decimalPart = ''] = value.split('.');

    if (integerPart.length > 1) {
      integerPart = integerPart.replace(/^0+/, '') || '0';
    }

    if (integerPart.length > 6) {
      integerPart = integerPart.slice(0, 6);
    }

    decimalPart = decimalPart.slice(0, 2);

    const normalizedValue = hasDot ? `${integerPart}.${decimalPart}` : integerPart;

    setEditForm((prev) => ({
      ...prev,
      salary: normalizedValue
    }));

    const salaryError = validateSalary(normalizedValue);
    setFieldErrors((prev) => ({
      ...prev,
      salary: salaryError
    }));
  };

  const handleSalaryFocus = () => {
    setSalaryFocused(true);
  };

  const handleSalaryBlur = () => {
    setSalaryFocused(false);
    setSalaryTouched(true);

    const currentValue = editForm.salary;
    const salaryError = validateSalary(currentValue);

    setFieldErrors((prev) => ({
      ...prev,
      salary: salaryError
    }));

    if (!currentValue) return;

    if (!stripCommas(currentValue).includes('.')) {
      setEditForm((prev) => ({
        ...prev,
        salary: `${stripCommas(currentValue)}.00`
      }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const errors = validateForm(editForm);
    setFieldErrors(errors);
    setSalaryTouched(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setEditLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        ...editForm,
        title: editForm.title.trim(),
        company: editForm.company.trim(),
        description: editForm.description.trim(),
        location: editForm.location.trim(),
        salary: editForm.salary ? normalizeSalaryForSubmit(editForm.salary) : '',
        skills: Array.isArray(editForm.skills) ? editForm.skills : [],
        applicationUrl: editForm.applicationUrl.trim()
      };

      const res = await updateVacancy(editingVacancy._id, payload);

      setSuccess('Vacancy updated successfully');
      setVacancies((prev) =>
        prev.map((v) => (v._id === editingVacancy._id ? res.data : v))
      );

      closeEditModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update vacancy error:', err);
      setError('Failed to update vacancy');
      setTimeout(() => setError(''), 3000);
    } finally {
      setEditLoading(false);
    }
  };

  const totalCount = vacancies.length;
  const activeCount = vacancies.filter((v) => !isExpired(v.deadline)).length;
  const expiredCount = vacancies.filter((v) => isExpired(v.deadline)).length;

  const totalPages = Math.max(1, Math.ceil(vacancies.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedVacancies = vacancies.slice(startIndex, startIndex + pageSize);
  const visibleFrom = vacancies.length === 0 ? 0 : startIndex + 1;
  const visibleTo = Math.min(startIndex + pageSize, vacancies.length);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          💼 Manage Vacancies
        </h1>
        <p className="text-gray-500 mt-1">
          Review, update or remove existing internship postings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Total Vacancies</p>
          <p className="text-3xl font-bold text-gray-800">{totalCount}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
          <p className="text-xs font-semibold uppercase text-green-500 mb-1">Active</p>
          <p className="text-3xl font-bold text-green-700">{activeCount}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
          <p className="text-xs font-semibold uppercase text-red-500 mb-1">Expired</p>
          <p className="text-3xl font-bold text-red-600">{expiredCount}</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm flex items-center gap-3">
          <span className="text-green-500 text-xl">✅</span>
          <p className="text-green-700 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm flex items-center gap-3">
          <span className="text-red-500 text-xl">⚠️</span>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Vacancy List</h2>
            <p className="text-sm text-gray-500">
              Showing {visibleFrom} to {visibleTo} of {vacancies.length} vacancies
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Page size</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Vacancy Details</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Uploaded Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {vacancies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No vacancies found.
                  </td>
                </tr>
              ) : (
                paginatedVacancies.map((v) => {
                  const expired = isExpired(v.deadline);

                  return (
                    <tr
                      key={v._id}
                      className={`transition-colors ${
                        expired ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 line-clamp-1">{v.title}</div>
                        <div className="text-sm text-gray-500">{v.company}</div>
                        {v.applicationUrl && (
                          <a
                            href={v.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline break-all"
                          >
                            {v.applicationUrl}
                          </a>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-400">📍</span>
                          {v.location || 'Remote'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-400">⏳</span>
                          {v.deadline ? new Date(v.deadline).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            expired
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}
                        >
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-400">📅</span>
                          {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(v)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-all"
                            title="Edit Vacancy"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteClick(v._id)}
                            disabled={deletingId === v._id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all ${
                              deletingId === v._id ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                            title="Delete Vacancy"
                          >
                            <span>🗑️</span>
                            <span>{deletingId === v._id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {vacancies.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {editingVacancy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Edit Vacancy</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none transition-all ${
                      fieldErrors.title
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-red-500'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none transition-all ${
                      fieldErrors.company
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-red-500'
                    }`}
                  />
                  {fieldErrors.company && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.company}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    min={getTodayDate()}
                    value={editForm.deadline}
                    onChange={(e) => handleFieldChange('deadline', e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none transition-all ${
                      fieldErrors.deadline
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-red-500'
                    }`}
                  />
                  {fieldErrors.deadline && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.deadline}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows="4"
                    value={editForm.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none transition-all resize-none ${
                      fieldErrors.description
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-red-500'
                    }`}
                  ></textarea>
                  {fieldErrors.description && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.description}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., JavaScript, React, Node.js"
                    value={Array.isArray(editForm.skills) ? editForm.skills.join(', ') : ''}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none transition-all ${
                      fieldErrors.skills
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-red-500'
                    }`}
                  />
                  {fieldErrors.skills && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.skills}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Application URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://company.com/apply"
                    value={editForm.applicationUrl}
                    onChange={(e) => handleFieldChange('applicationUrl', e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none transition-all ${
                      fieldErrors.applicationUrl
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-red-500'
                    }`}
                  />
                  {fieldErrors.applicationUrl && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.applicationUrl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Salary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 45,000.00"
                    value={formatSalaryDisplay(editForm.salary, salaryFocused)}
                    onChange={handleSalaryChange}
                    onFocus={handleSalaryFocus}
                    onBlur={handleSalaryBlur}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none transition-all ${
                      salaryTouched && fieldErrors.salary
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-2 focus:ring-red-500'
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter 4 to 6 digits. Commas are added automatically.
                  </p>
                  {salaryTouched && fieldErrors.salary && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.salary}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Job Type
                  </label>
                  <select
                    value={editForm.jobType}
                    onChange={(e) => handleFieldChange('jobType', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {editLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Delete</h2>
              <p className="text-gray-600">
                Are you sure you want to delete this vacancy?
              </p>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deletingId === selectedVacancyId}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {deletingId === selectedVacancyId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}