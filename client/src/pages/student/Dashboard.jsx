import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import NotificationBell from '../../components/NotificationBell';

const STUDY_API = 'http://localhost:5003/api/study-materials';
const AUTH_API = 'http://localhost:5001/api/auth';
const VACANCY_API = 'http://localhost:5002/api/vacancies';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ materials: 0, vacancies: 0 });
  const [profile, setProfile] = useState(null);
  const [recentVacancies, setRecentVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, vacancyRes, profileRes] = await Promise.all([
          fetch(STUDY_API, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(VACANCY_API, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${AUTH_API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const materials = await materialsRes.json();
        const vacancies = await vacancyRes.json();
        const profileData = await profileRes.json();
        setStats({
          materials: Array.isArray(materials) ? materials.length : 0,
          vacancies: Array.isArray(vacancies) ? vacancies.length : 0
        });
        setRecentVacancies(Array.isArray(vacancies) ? vacancies.slice(0, 3) : []);
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner message="Loading dashboard..." />;

  const statCards = [
    { label: 'Available Vacancies', value: stats.vacancies, path: '/student/vacancies' },
    { label: 'My Applications', value: 0, path: '/student/applications' },
    { label: 'Study Materials', value: stats.materials, path: '/student/study-materials' },
    { label: 'Quizzes Taken', value: 0, path: '/student/quizzes' },
  ];

  const quickActions = [
    { label: 'Browse Vacancies', icon: '🔍', color: 'bg-blue-800 hover:bg-blue-900', path: '/student/vacancies' },
    { label: 'My Applications', icon: '📋', color: 'bg-orange-400 hover:bg-orange-200', path: '/student/applications' },
    { label: 'Study Materials', icon: '📖', color: 'bg-blue-600 hover:bg-blue-700', path: '/student/study-materials' },
    { label: 'Take a Quiz', icon: '✏️', color: 'bg-orange-400 hover:bg-orange-200', path: '/student/quizzes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Banner with profile photo in navbar */}
      <div className="relative px-8 py-8" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1920&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center'
      }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/85"></div>
        <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-yellow-500 text-sm font-medium mb-1">Student Portal</p>
            <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {user?.name}</h1>
            <p className="text-blue-200">Ready to find your dream internship today?</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <p className="text-white font-semibold">{profile?.name}</p>
              <p className="text-yellow-500 text-sm">{profile?.email}</p>
            </div>
            {profile?.photo ? (
              <img src={profile.photo} alt="profile"
                className="w-14 h-14 rounded-2xl border-2 border-white/30 object-cover cursor-pointer"
                onClick={() => navigate('/student/settings')} />
            ) : (
              <div
                onClick={() => navigate('/student/settings')}
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:bg-white/30 transition-all">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 -mt-6">
          {statCards.map(card => (
            <div key={card.label} onClick={() => navigate(card.path)}
              className="bg-white rounded-lg shadow-sm p-5 cursor-pointer hover:shadow-md transition-all border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#1e3a8a] rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  View
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
              <div className="text-gray-500 text-sm mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Vacancies - full width */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Recent Vacancies</h2>
            <button onClick={() => navigate('/student/vacancies')}
              className="text-blue-700 text-sm font-medium hover:text-orange-600 transition-colors">
              View All →
            </button>
          </div>
          {recentVacancies.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">💼</div>
              <p>No vacancies available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentVacancies.map(v => (
                <div key={v._id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100"
                  onClick={() => navigate('/student/vacancies')}>
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt={v.company} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl shrink-0">💼</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{v.title}</p>
                    <p className="text-gray-500 text-sm mt-0.5 truncate">{v.company} • {v.location}</p>
                    {v.salary && (
                      <p className="text-green-600 text-xs mt-0.5">💰 {v.salary}</p>
                    )}
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {v.jobType || 'Internship'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <button key={action.label} onClick={() => navigate(action.path)}
                className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white p-4 rounded-lg text-center transition-all">
                <div className="text-sm font-medium">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="rounded-2xl p-6 text-white"
          style={{background: 'linear-gradient(135deg, #1e3a8a 0%, #2d3f71 60%, #91692d 100%)'}}>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{stats.vacancies}</div>
              <div className="text-blue-200 text-sm mt-1">Available Vacancies</div>
            </div>
            <div className="border-x border-white/20">
              <div className="text-3xl font-bold text-white">{stats.materials}</div>
              <div className="text-blue-200 text-sm mt-1">Study Materials</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">0</div>
              <div className="text-blue-200 text-sm mt-1">My Applications</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}