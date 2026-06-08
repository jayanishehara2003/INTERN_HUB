import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/admin/dashboard',      label: 'Dashboard',        icon: '🏠' },
  { path: '/admin/users',          label: 'Manage Users',     icon: '👥' },
  { path: '/admin/post-vacancy',   label: 'Post Vacancy',     icon: '➕' },
  { path: '/admin/vacancies',      label: 'Manage Vacancies', icon: '💼' },
  { path: '/admin/applications',   label: 'Applications',     icon: '📋' },
  { path: '/admin/upload-material',label: 'Upload Material',  icon: '📚' },
  { path: '/admin/messages',       label: 'Messages',         icon: '📬' },
  { path: '/admin/quizzes',        label: 'Manage Quizzes',   icon: '🧠' },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`h-screen ${collapsed ? 'w-20' : 'w-64'} text-white flex flex-col fixed left-0 top-0 transition-all duration-300 z-40`}
        style={{background: 'linear-gradient(180deg, #0a1943 100%, #1d4ed8 40%, #F68048 100%)'}}
      >
        {/* Logo + Toggle */}
        <div className={`p-4 border-b border-white/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">🎓 InternHub</h1>
              <p className="text-blue-200 text-xs mt-0.5">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white text-lg"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-lg shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{user?.name}</p>
                <p className="text-orange-200 text-xs">Administrator</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-orange-400/80 text-white shadow-lg shadow-orange-900/50 backdrop-blur-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : ''}
            className={`w-full px-3 py-3 bg-orange-400 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-xl">🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Scrollbar hide style + main margin */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        main { margin-left: ${collapsed ? '80px' : '256px'}; transition: margin-left 0.3s; }
      `}</style>
    </>
  );
}