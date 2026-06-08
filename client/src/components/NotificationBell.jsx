import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = () => {
    const saved = JSON.parse(localStorage.getItem('studyMaterialNotifications') || '[]');
    setNotifications(saved);
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    localStorage.setItem('studyMaterialNotifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem('studyMaterialNotifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem('studyMaterialNotifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  const handleViewMaterial = (materialId) => {
    console.log('🔔 Navigating to material ID:', materialId);
    markAsRead(notifications.find(n => n.materialId === materialId)?.id);
    setShowDropdown(false);
    // Navigate to study materials page with highlight parameter
    navigate(`/student/study-materials?highlight=${materialId}`);
  };

  useEffect(() => {
    loadNotifications();
    
    const handleNewMaterial = () => {
      loadNotifications();
    };
    
    window.addEventListener('newMaterialAdded', handleNewMaterial);
    return () => window.removeEventListener('newMaterialAdded', handleNewMaterial);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-all"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
            <div className="p-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">🔔 Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  🔕 No notifications yet
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-all cursor-pointer ${
                      !notif.isRead ? 'bg-orange-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="text-2xl">📚</div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleViewMaterial(notif.materialId)}
                            className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                          >
                            View Material →
                          </button>
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}