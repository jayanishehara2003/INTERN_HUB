import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/student/dashboard',       label: 'Dashboard',       icon: '🏠' },
  { path: '/student/vacancies',       label: 'Vacancies',       icon: '💼' },
  { path: '/student/applications',    label: 'My Applications', icon: '📋' },
  { path: '/student/study-materials', label: 'Study Materials', icon: '📚' },
  { path: '/student/quizzes',         label: 'Quizzes',         icon: '🧠' },
  { path: '/student/cv-builder',      label: 'CV Builder',      icon: '📄' },
  { path: '/student/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
  navigate('/student/settings');
   };

  return (
    <>
      <div
        className={`h-screen ${collapsed ? 'w-20' : 'w-64'} text-white flex flex-col fixed left-0 top-0 transition-all duration-300 z-40`}
        style={{background: 'linear-gradient(180deg, #0a1943 100%, #1d4ed8 0%, #F68048 100%)'}}
      >
        {/* Logo + Toggle */}
        <div className={`p-4 border-b border-white/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">🎓 InternHub</h1>
              <p className="text-blue-200 text-xs mt-0.5">Student Portal</p>
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
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {/* Edit icon for collapsed state */}
              <button
                onClick={handleEditProfile}
                title="Edit Profile"
                className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 hover:bg-orange-400 rounded-full flex items-center justify-center transition-all shadow-md opacity-0 group-hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="w-2.5 h-2.5">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5v-.5h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative group shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                {/* Edit icon for expanded state */}
                <button
                  onClick={handleEditProfile}
                  title="Edit Profile"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 hover:bg-orange-400 rounded-full flex items-center justify-center transition-all shadow-md opacity-0 group-hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="w-2.5 h-2.5">
                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5v-.5h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                  </svg>
                </button>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-semibold text-sm truncate">{user?.name}</p>
                <p className="text-blue-200 text-xs truncate">{user?.email}</p>
              </div>
              {/* Edit button - always visible in expanded mode */}
              <button
                onClick={handleEditProfile}
                title="Edit Profile"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-all shrink-0 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="w-3 h-3">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5v-.5h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                </svg>
              </button>
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        main { margin-left: ${collapsed ? '80px' : '256px'}; transition: margin-left 0.3s; }
      `}</style>
    </>
  );
}