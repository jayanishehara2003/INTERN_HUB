import { useState, useEffect } from 'react';
import Spinner from '../../components/Spinner';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const APP_API = 'http://localhost:5002/api/applications/my';

  useEffect(() => {
    const fetchMyApplications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(APP_API, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setApplications(data);
        } else {
          setError(data.message || 'Failed to fetch your applications.');
        }
      } catch (err) {
        setError('Failed to fetch your applications.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyApplications();
  }, []);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    accepted: 'bg-green-100 text-green-700 border border-green-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
  };

  if (loading) return <Spinner message="Loading your applications..." />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 My Applications</h1>
        <p className="text-gray-500">Track your internship applications and their status.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="mt-8 bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Applications Yet</h2>
          <p className="text-gray-500 mb-6">You haven't applied for any vacancies yet. Start exploring now!</p>
          <a 
            href="/student/vacancies" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-800 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Browse Vacancies
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div key={app._id} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all border-l-4 border-l-blue-600">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[app.status] || statusColors.pending}`}>
                    {app.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1">{app.vacancyId?.title || 'Unknown Vacancy'}</h3>
                <p className="text-blue-700 font-medium text-sm mb-4">🏢 {app.vacancyId?.company || 'Unknown Company'}</p>
                
                <div className="pt-4 border-t border-gray-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📍</span> {app.vacancyId?.location || 'Not specified'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📧</span> Applied with: {app.email}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Application Status</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}