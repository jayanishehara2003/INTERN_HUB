import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AUTH_API = 'http://localhost:5001/api/auth';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    all: localStorage.getItem('notif_all') !== 'false',
    vacancy: localStorage.getItem('notif_vacancy') !== 'false',
    application: localStorage.getItem('notif_application') !== 'false',
    material: localStorage.getItem('notif_material') !== 'false',
  });

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    photo: '',
  });

  const [passwords, setPasswords] = useState({
    newPass: '', confirm: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${AUTH_API}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          photo: data.photo || '',
        });
      } catch (err) { console.error('Failed to fetch profile'); }
    };
    fetchProfile();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Photo must be under 2MB!'); return; }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 200; canvas.height = 200;
      ctx.drawImage(img, 0, 0, 200, 200);
      setProfile(prev => ({ ...prev, photo: canvas.toDataURL('image/jpeg', 0.8) }));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true); setSuccess(''); setError('');
    try {
      const payload = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        photo: profile.photo
      };
      if (passwords.newPass) {
        if (passwords.newPass !== passwords.confirm) {
          setError('New passwords do not match!'); setSaving(false); return;
        }
        if (passwords.newPass.length < 6) {
          setError('Password must be at least 6 characters!'); setSaving(false); return;
        }
        payload.password = passwords.newPass;
      }
      const res = await fetch(`${AUTH_API}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Profile updated successfully! Please refresh to see changes.');
        setPasswords({ newPass: '', confirm: '' });
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) { setError('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleDarkMode = (val) => {
    setDarkMode(val);
    localStorage.setItem('darkMode', val);
    if (val) {
      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
    } else {
      document.documentElement.style.filter = '';
    }
  };

  const handleNotif = (key, val) => {
    const updated = { ...notifSettings, [key]: val };
    if (key === 'all') {
      const allVal = val;
      Object.keys(updated).forEach(k => {
        updated[k] = allVal;
        localStorage.setItem(`notif_${k}`, allVal);
      });
    } else {
      localStorage.setItem(`notif_${key}`, val);
    }
    setNotifSettings(updated);
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${AUTH_API}/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
        navigate('/');
      }
    } catch (err) { setError('Failed to delete account'); }
  };

  const sections = [
    { id: 'profile', label: 'Edit Profile', icon: '👤' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
  ];

  const notifItems = [
    { id: 'all', label: 'All Notifications', desc: 'Master toggle for all notifications', icon: '🔔' },
    { id: 'vacancy', label: 'New Vacancies', desc: 'Get notified when new internships are posted', icon: '💼' },
    { id: 'application', label: 'Application Updates', desc: 'Updates on your internship applications', icon: '📋' },
    { id: 'material', label: 'New Study Materials', desc: 'Get notified when new materials are uploaded', icon: '📚' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">⚙️ Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit sticky top-6">
          {/* Mini Profile */}
          <div className="flex flex-col items-center p-4 mb-4 bg-gradient-to-br from-blue-900 to-orange-600 rounded-xl">
            {profile.photo ? (
              <img src={profile.photo} alt="profile" className="w-16 h-16 rounded-2xl object-cover border-2 border-white mb-2" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold mb-2">
                {profile.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <p className="text-white font-semibold text-sm">{profile.name}</p>
            <p className="text-blue-100 text-xs">{profile.email}</p>
            <span className="mt-1 px-2 py-0.5 bg-orange-500/50 text-white rounded-full text-xs">{user?.role}</span>
          </div>

          <div className="space-y-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-gradient-to-r from-blue-800 to-orange-200 text-white shadow-lg'
                    : s.id === 'danger'
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <span className="text-xl">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              ❌ {error}
            </div>
          )}

          {/* Edit Profile */}
          {activeSection === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">👤 Edit Profile</h2>

              {/* Photo Upload */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
                <div className="relative">
                  {profile.photo ? (
                    <img src={profile.photo} alt="Profile" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-800 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {profile.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-800 hover:bg-orange-600 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg">
                    <span className="text-white text-sm">📷</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{profile.name}</p>
                  <p className="text-gray-500 text-sm mb-3">{user?.role} • Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''}</p>
                  <div className="flex gap-2">
                    <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium cursor-pointer transition-all">
                      📷 Change Photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {profile.photo && (
                      <button onClick={() => setProfile(p => ({ ...p, photo: '' }))}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all">
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input type="text" value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input type="text" placeholder="+94 77 123 4567" value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input type="email" value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Change Password */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">🔒 Change Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input type="password" placeholder="Min 6 characters" value={passwords.newPass}
                        onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input type="password" placeholder="Repeat new password" value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  {passwords.newPass && passwords.confirm && passwords.newPass !== passwords.confirm && (
                    <p className="text-red-500 text-xs mt-2">❌ Passwords do not match!</p>
                  )}
                  {passwords.newPass && passwords.confirm && passwords.newPass === passwords.confirm && (
                    <p className="text-green-500 text-xs mt-2">✅ Passwords match!</p>
                  )}
                </div>

                <button onClick={handleSaveProfile} disabled={saving}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : '💾 Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">🎨 Appearance</h2>
              <p className="text-gray-500 text-sm mb-6">Customize how InternHub looks for you</p>

              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{darkMode ? '🌙' : '☀️'}</span>
                    <div>
                      <p className="font-semibold text-gray-800">Dark Mode</p>
                      <p className="text-gray-500 text-sm">{darkMode ? 'Currently using dark theme' : 'Currently using light theme'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDarkMode(!darkMode)}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${darkMode ? 'bg-blue-800' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${darkMode ? 'left-7' : 'left-0.5'}`}></span>
                  </button>
                </div>

                {/* Preview Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => handleDarkMode(false)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${!darkMode ? 'border-blue-800 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="bg-white rounded-lg p-3 shadow-sm mb-3 border border-gray-100">
                      <div className="h-3 bg-blue-200 rounded mb-2 w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-1/2 mb-1"></div>
                      <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 text-center">☀️ Light Mode</p>
                    {!darkMode && <p className="text-xs text-blue-700 text-center mt-1 font-medium">✓ Currently Active</p>}
                  </div>
                  <div onClick={() => handleDarkMode(true)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${darkMode ? 'border-blue-800 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="bg-gray-900 rounded-lg p-3 shadow-sm mb-3 border border-gray-700">
                      <div className="h-3 bg-blue-600 rounded mb-2 w-3/4"></div>
                      <div className="h-2 bg-gray-700 rounded w-1/2 mb-1"></div>
                      <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 text-center">🌙 Dark Mode</p>
                    {darkMode && <p className="text-xs text-blue-700 text-center mt-1 font-medium">✓ Currently Active</p>}
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-orange-700 text-sm">💡 Dark mode applies a filter to the entire page. For best experience use Light mode.</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">🔔 Notifications</h2>
              <p className="text-gray-500 text-sm mb-6">Choose what notifications you receive</p>
              <div className="space-y-3">
                {notifItems.map((item, index) => (
                  <div key={item.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      item.id === 'all' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className={`font-semibold ${item.id === 'all' ? 'text-blue-800' : 'text-gray-800'}`}>
                          {item.label}
                          {item.id === 'all' && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Master</span>}
                        </p>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNotif(item.id, !notifSettings[item.id])}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${notifSettings[item.id] ? 'bg-orange-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${notifSettings[item.id] ? 'left-7' : 'left-0.5'}`}></span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-500 text-sm text-center">
                  {Object.values(notifSettings).filter(Boolean).length} of {notifItems.length} notifications enabled
                </p>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeSection === 'danger' && (
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
              <h2 className="text-xl font-bold text-red-600 mb-2">⚠️ Danger Zone</h2>
              <p className="text-gray-500 text-sm mb-6">These actions are permanent and cannot be undone!</p>

              <div className="space-y-4">
                <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-red-700 text-lg">🗑️ Delete Account</p>
                      <p className="text-red-500 text-sm mt-1">This will permanently delete:</p>
                      <ul className="text-red-400 text-xs mt-2 space-y-1">
                        <li>• Your profile and personal information</li>
                        <li>• Your CV and all saved versions</li>
                        <li>• Your application history</li>
                        <li>• All your account data</li>
                      </ul>
                    </div>
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shrink-0 shadow-lg">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">⚠️</div>
                      <h3 className="text-xl font-bold text-gray-800">Are you absolutely sure?</h3>
                      <p className="text-gray-500 mt-2 text-sm">This will permanently delete your account <strong>{profile.name}</strong> and all associated data. This action cannot be undone!</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
                        Cancel
                      </button>
                      <button onClick={handleDeleteAccount}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all">
                        Yes, Delete Forever!
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}