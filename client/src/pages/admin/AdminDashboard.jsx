import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const AUTH_API = 'http://localhost:5001/api/auth';
const STUDY_API = 'http://localhost:5003/api/study-materials';
const VACANCY_API = 'http://localhost:5002/api/vacancies';
const CV_STATS_API = 'http://localhost:5001/api/cv/admin/stats';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, materials: 0, vacancies: 0, messages: 0 });
  const [activities, setActivities] = useState([]);
  const [chartData, setChartData] = useState({ pie: [], bar: [] });
  const [loading, setLoading] = useState(true);
  const [cvStats, setCvStats] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, materialsRes, vacancyRes, messagesRes] = await Promise.all([
          fetch(`${AUTH_API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(STUDY_API, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(VACANCY_API, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://localhost:5001/api/messages`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const users = await usersRes.json();
        const materials = await materialsRes.json();
        const vacancies = await vacancyRes.json();
        const messages = await messagesRes.json();
        const students = users.filter(u => u.role === 'student');

        setStats({
          students: students.length,
          materials: materials.length,
          vacancies: vacancies.length,
          messages: messages.filter(m => !m.isRead).length
        });

        setChartData({
          pie: [
            { name: 'Students', value: students.length, color: '#1e3a8a' },
            { name: 'Vacancies', value: vacancies.length, color: '#ca8a04' },
            { name: 'Materials', value: materials.length, color: '#1e40af' },
            { name: 'Messages', value: messages.length, color: '#854d0e' },
          ],
          bar: [
            { name: 'Students', count: students.length, fill: '#1e3a8a' },
            { name: 'Vacancies', count: vacancies.length, fill: '#ca8a04' },
            { name: 'Materials', count: materials.length, fill: '#1e40af' },
            { name: 'Messages', count: messages.length, fill: '#854d0e' },
          ]
        });

        const monthlyData = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const monthName = d.toLocaleString('default', { month: 'short' });
          const count = students.filter(s => {
            const created = new Date(s.createdAt);
            return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
          }).length;
          return { month: monthName, students: count };
        });

        setChartData(prev => ({ ...prev, monthly: monthlyData }));

        // CV Stats
        try {
          const cvRes = await fetch(CV_STATS_API, { headers: { Authorization: `Bearer ${token}` } });
          const cvData = await cvRes.json();
          setCvStats(Array.isArray(cvData) ? cvData : []);
        } catch (e) { setCvStats([]); }

        const userActivities = students.slice(0, 2).map(u => ({
          id: u._id,
          text: `${u.name} registered as student`,
          time: new Date(u.createdAt),
        }));
        const materialActivities = materials.slice(0, 2).map(m => ({
          id: m._id,
          text: `Study material "${m.title}" uploaded`,
          time: new Date(m.createdAt),
        }));
        const vacancyActivities = vacancies.slice(0, 2).map(v => ({
          id: v._id,
          text: `Vacancy "${v.title}" posted at ${v.company}`,
          time: new Date(v.createdAt),
        }));

        const allActivities = [...userActivities, ...materialActivities, ...vacancyActivities]
          .sort((a, b) => b.time - a.time).slice(0, 5)
          .map(a => ({ ...a, time: a.time.toLocaleDateString() }));
        setActivities(allActivities);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner message="Loading dashboard..." />;

  const statCards = [
    { label: 'Total Students', value: stats.students, path: '/admin/users' },
    { label: 'Active Vacancies', value: stats.vacancies, path: '/admin/vacancies' },
    { label: 'Study Materials', value: stats.materials, path: '/admin/upload-material' },
    { label: 'Unread Messages', value: stats.messages, path: '/admin/messages' },
  ];

  const quickActions = [
    { label: 'Post Vacancy', icon: '➕', color: 'bg-blue-800 hover:bg-blue-900', path: '/admin/post-vacancy' },
    { label: 'Manage Users', icon: '👥', color: 'bg-orange-500 hover:bg-orange-600', path: '/admin/users' },
    { label: 'Upload Material', icon: '📤', color: 'bg-blue-600 hover:bg-blue-700', path: '/admin/upload-material' },
    { label: 'View Messages', icon: '📬', color: 'bg-orange-600 hover:bg-orange-700', path: '/admin/messages' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Banner */}
      <div className="relative px-8 py-8" style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center'
      }}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/92 via-blue-800/88 "></div>
        <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-yellow-500 text-sm font-medium mb-1">Admin Panel</p>
            <h1 className="text-3xl font-bold text-white mb-1">Welcome, {user?.name}</h1>
            <p className="text-blue-200">System overview and management</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-semibold">{user?.name}</p>
              <p className="text-yellow-500 text-sm">Administrator</p>
            </div>
            <div className="w-14 h-14 rounded-lg bg-yellow-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 -mt-6">
          {statCards.map(card => (
            <div key={card.label} onClick={() => navigate(card.path)}
              className="bg-white rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.light} rounded-xl flex items-center justify-center text-xl`}>{card.icon}</div>
                <span className={`text-xs font-medium ${card.light} px-2 py-1 rounded-full`}>View →</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
              <div className="text-gray-500 text-sm mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">System Overview</h2>
            <p className="text-gray-400 text-sm mb-5">Total count per category</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.bar} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.bar?.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">System Distribution</h2>
            <p className="text-gray-400 text-sm mb-5">Percentage breakdown</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData.pie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {chartData.pie?.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Registration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Student Registrations</h2>
          <p className="text-gray-400 text-sm mb-5">Monthly student sign-ups over last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.monthly} barSize={35}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="students" fill="#1d4ed8" radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => (
                <button key={action.label} onClick={() => navigate(action.path)}
                  className={`${action.color} text-white p-4 rounded-xl text-center transition-all hover:shadow-lg hover:-translate-y-0.5`}>
                  <div className="text-2xl mb-1">{action.icon}</div>
                  <div className="text-xs font-medium">{action.label}</div>
                </button>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">System Status</h3>
              <div className="space-y-2">
                {[
                  { label: 'Auth Service', port: '5001' },
                  { label: 'Vacancy Service', port: '5002' },
                  { label: 'Study Service', port: '5003' },
                ].map(service => (
                  <div key={service.label} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-gray-600 font-medium">{service.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="text-gray-500 text-xs">:{service.port}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Latest updates</span>
            </div>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-all">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 text-sm font-medium truncate">{activity.text}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CV Downloads Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">📄 CV Downloads</h2>
              <p className="text-gray-500 text-sm mt-0.5">Students who downloaded their CV</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              {cvStats.length} students
            </span>
          </div>

          {cvStats.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📄</div>
              <p>No CV downloads yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Downloads</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Download</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cvStats.map((cv, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-all">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-800 to-orange-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {cv.userId?.name?.charAt(0).toUpperCase() || cv.name?.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {cv.userId?.name || cv.name || 'Unknown'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">{cv.userId?.email || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                          ⬇️ {cv.downloadCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {cv.lastDownloaded
                          ? new Date(cv.lastDownloaded).toLocaleDateString() + ' ' +
                            new Date(cv.lastDownloaded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {cv.userId?.createdAt
                          ? new Date(cv.userId.createdAt).toLocaleDateString()
                          : cv.createdAt
                          ? new Date(cv.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}