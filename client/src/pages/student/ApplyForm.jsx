import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';

const VACANCY_API = 'http://localhost:5002/api/vacancies';

export default function ApplyForm() {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const res = await fetch(`${VACANCY_API}/${vacancyId}`);
        const data = await res.json();
        if (res.ok) {
          setVacancy(data);
        } else {
          setError(data.message || 'Failed to fetch vacancy details.');
        }
      } catch (err) {
        setError('Failed to fetch vacancy details.');
      } finally {
        setLoading(false);
      }
    };
    fetchVacancy();
  }, [vacancyId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const fillDemoData = () => {
    setFormData({
      email: 'student.demo@example.com',
      phone: '0771234567',
      coverLetter: 'I am a passionate software engineering student with a strong background in JavaScript and React. I am very interested in this internship opportunity at your company and believe my skills align well with your requirements. I have worked on several academic projects and I am eager to contribute to a professional team.'
    });
    setError('Demo data filled! Just select any PDF/DOC file to proceed.');
    setTimeout(() => setError(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your CV.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('coverLetter', formData.coverLetter);
      data.append('cv', file);

      const res = await fetch(`${VACANCY_API}/${vacancyId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const result = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/student/applications'), 2000);
      } else {
        setError(result.message || 'Failed to submit application.');
      }
    } catch (err) {
      setError('An error occurred while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner message="Loading application form..." />;

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="max-w-3xl w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🚀 Apply for Vacancy</h1>
            <p className="text-gray-500 mt-1">Complete your application for {vacancy?.title || 'position'}.</p>
          </div>
          <button 
            onClick={() => navigate('/student/vacancies')}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            ← Back to Vacancies
          </button>
        </div>

        {vacancy && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-orange-600 flex items-center justify-center text-white text-3xl shadow-lg">
              {vacancy.imageUrl ? <img src={vacancy.imageUrl} alt="" className="w-full h-full object-cover rounded-2xl" /> : '💼'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{vacancy.title}</h2>
              <p className="text-blue-700 font-medium text-sm">🏢 {vacancy.company}</p>
              <p className="text-gray-500 text-xs">📍 {vacancy.location}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <p className="text-green-700 text-sm font-medium">Application submitted successfully! Redirecting...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+94 7X XXX XXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Letter / Message</label>
              <textarea 
                name="coverLetter"
                rows="5"
                value={formData.coverLetter}
                onChange={handleChange}
                placeholder="Tell us why you are a good fit for this role..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload CV (PDF, DOC, DOCX) *</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-blue-400 transition-all cursor-pointer bg-gray-50 relative group">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.doc,.docx"
                  required
                />
                <div className="space-y-1 text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📄</div>
                  <div className="flex text-sm text-gray-600">
                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      {file ? file.name : 'Upload a file'}
                    </span>
                    {!file && <p className="pl-1">or drag and drop</p>}
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC up to 5MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/student/vacancies')}
              className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={fillDemoData}
              className="px-6 py-3 text-sm font-bold text-orange-600 border border-orange-200 hover:bg-orange-50 rounded-xl transition-all"
            >
              Demo Data
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="px-10 py-3.5 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
