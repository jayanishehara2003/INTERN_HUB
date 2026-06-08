import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser(form);
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left Side - Image */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,18,51,0.93) 0%, rgba(0,30,80,0.92) 100%)' }}></div>
        <div className="relative z-10 text-center">
          <div
            className="w-20 h-20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl mx-auto mb-6"
            style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.35)' }}
          >
            🎓
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome Back!</h1>
          <p className="text-lg mb-8 max-w-sm" style={{ color: '#93b4d4' }}>
            Log in to continue your internship journey with InternHub
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { value: '50+', label: 'Companies' },
              { value: '200+', label: 'Students' },
              { value: '100+', label: 'Internships' },
            ].map(stat => (
              <div
                key={stat.label}
                className="backdrop-blur-sm rounded-xl p-4"
                style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.18)' }}
              >
                <div className="text-2xl font-bold" style={{ color: '#facc15' }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: '#93b4d4' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div
            className="mt-8 backdrop-blur-sm rounded-2xl p-6 max-w-sm mx-auto text-left"
            style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.15)' }}
          >
            <p className="text-sm italic mb-3" style={{ color: '#c8ddf0' }}>
              "InternHub helped me land my dream internship at a top tech company in Colombo!"
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: '#facc15', color: '#001233' }}
              >
                S
              </div>
              <div>
                <div className="text-white text-sm font-medium">Samanali P.</div>
                <div className="text-xs" style={{ color: '#93b4d4' }}>Software Engineering, SLIIT</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#000d24' }}>
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-4xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold text-white">InternHub</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Login</h2>
            <p style={{ color: '#5a7fa8' }}>Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5' }}
            >
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#93b4d4' }}>Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#3b5f82' }}>📧</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-white text-sm transition-all focus:outline-none"
                  style={{
                    background: '#001233',
                    border: '1px solid #0d3460',
                    color: '#e2eaf4',
                    '--tw-ring-color': '#facc15',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#facc15'; e.target.style.boxShadow = '0 0 0 2px rgba(250,204,21,0.18)'; }}
                  onBlur={e => { e.target.style.borderColor = '#0d3460'; e.target.style.boxShadow = 'none'; }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: '#93b4d4' }}>Password</label>
                <span className="text-xs hover:opacity-80 cursor-pointer transition-opacity" style={{ color: '#facc15' }}>
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#3b5f82' }}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: '#001233', border: '1px solid #0d3460', color: '#e2eaf4' }}
                  onFocus={e => { e.target.style.borderColor = '#facc15'; e.target.style.boxShadow = '0 0 0 2px rgba(250,204,21,0.18)'; }}
                  onBlur={e => { e.target.style.borderColor = '#0d3460'; e.target.style.boxShadow = 'none'; }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm transition-opacity hover:opacity-80"
                  style={{ color: '#5a7fa8' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 font-semibold rounded-xl transition-all text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)',
                color: '#001233',
                boxShadow: '0 4px 20px rgba(250,204,21,0.28)',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.target.style.filter = 'none'; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(0,18,51,0.3)', borderTopColor: '#001233' }}
                  ></div>
                  Logging in...
                </span>
              ) : 'Login →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#3b5f82' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#facc15' }}>
              Register here
            </Link>
          </p>

          {/* Back to home */}
          <p className="text-center mt-4">
            <Link to="/" className="text-xs transition-colors hover:opacity-70" style={{ color: '#2a4a6b' }}>
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}