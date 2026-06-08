import { useState, useEffect } from 'react';
import Spinner from '../../components/Spinner';

const AUTH_API = 'http://localhost:5001/api';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem('token');

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${AUTH_API}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    setDeletingId(id);
    try {
      await fetch(`${AUTH_API}/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.filter(m => m._id !== id));
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await fetch(`${AUTH_API}/messages/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(messages.map(m => m._id === id ? { ...m, isRead: true } : m));
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  if (loading) return <Spinner message="Loading messages..." />;

  const unread = messages.filter(m => !m.isRead).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📬 Contact Messages</h1>
        <p className="text-gray-500 mt-1">Messages from students and visitors.</p>
      </div>

      {unread > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg mb-6">
          📩 You have {unread} unread message{unread > 1 ? 's' : ''}!
        </div>
      )}

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p>No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg._id} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${msg.isRead ? 'border-gray-200' : 'border-indigo-500'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{msg.name}</div>
                      <div className="text-gray-500 text-sm">{msg.email}</div>
                    </div>
                    {!msg.isRead && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">New</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm ml-13 pl-1">{msg.message}</p>
                  <p className="text-gray-400 text-xs mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {!msg.isRead && (
                    <button
                      onClick={() => handleMarkRead(msg._id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm transition-all"
                    >
                      ✓ Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg._id)}
                    disabled={deletingId === msg._id}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-all disabled:opacity-50"
                  >
                    {deletingId === msg._id ? '⏳' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}