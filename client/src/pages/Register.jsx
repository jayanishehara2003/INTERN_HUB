import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (form.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters.';
  } else if (!/^[a-zA-Z\s'-]+$/.test(form.name.trim())) {
    errors.name = 'Name can only contain letters, spaces, hyphens, or apostrophes.';
  }

  if (!form.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Password must include at least one uppercase letter.';
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = 'Password must include at least one number.';
  } else if (!/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = 'Password must include at least one special character.';
  }

  return errors;
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Very Weak', color: '#ef4444' };
  if (score === 2) return { score, label: 'Weak', color: '#f97316' };
  if (score === 3) return { score, label: 'Fair', color: '#eab308' };
  if (score === 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score, label: 'Very Strong', color: '#facc15' };
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const strength = getPasswordStrength(form.password);

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      const newErrors = validate(updated);
      setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = validate(form);
    setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { name: true, email: true, password: true };
    setTouched(allTouched);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      const res = await registerUser(form);
      login(res.data.token, res.data.user);
      navigate('/student/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background: '#001233',
    border: `1px solid ${touched[field] && errors[field] ? '#ef4444' : touched[field] && !errors[field] ? '#22c55e' : '#0d3460'}`,
    color: '#e2eaf4',
  });

  const focusStyle = (e, field) => {
    e.target.style.borderColor = touched[field] && errors[field] ? '#ef4444' : '#facc15';
    e.target.style.boxShadow = `0 0 0 2px ${touched[field] && errors[field] ? 'rgba(239,68,68,0.18)' : 'rgba(250,204,21,0.18)'}`;
  };

  const blurStyle = (e, field) => {
    e.target.style.borderColor = touched[field] && errors[field] ? '#ef4444' : touched[field] ? '#22c55e' : '#0d3460';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen flex">

      {/* Left Side */}
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
          <h1 className="text-4xl font-bold text-white mb-4">InternHub</h1>
          <p className="text-lg mb-8 max-w-sm" style={{ color: '#93b4d4' }}>
            Your gateway to internship success in Sri Lanka
          </p>

          {/* Features list */}
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              { icon: '💼', text: 'Browse 100+ internship opportunities' },
              { icon: '📚', text: 'Access curated study materials' },
              { icon: '🧠', text: 'Take skill assessment quizzes' },
              { icon: '📋', text: 'Track all your applications' },
            ].map(item => (
              <div
                key={item.text}
                className="flex items-center gap-3 backdrop-blur-sm rounded-xl px-4 py-3"
                style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white text-sm">{item.text}</span>
              </div>
            ))}
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
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p style={{ color: '#5a7fa8' }}>Join thousands of students finding internships</p>
          </div>

          {serverError && (
            <div
              className="px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
              style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5' }}
            >
              ❌ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#93b4d4' }}>Full Name</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#3b5f82' }}>👤</span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  onFocus={e => focusStyle(e, 'name')}
                  className="w-full pl-11 pr-10 py-3 rounded-xl text-sm transition-all focus:outline-none"
                  style={inputStyle('name')}
                />
                {touched.name && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                    {errors.name ? '❌' : '✅'}
                  </span>
                )}
              </div>
              {touched.name && errors.name && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  ⚠️ {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#93b4d4' }}>Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#3b5f82' }}>📧</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  onFocus={e => focusStyle(e, 'email')}
                  className="w-full pl-11 pr-10 py-3 rounded-xl text-sm transition-all focus:outline-none"
                  style={inputStyle('email')}
                />
                {touched.email && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                    {errors.email ? '❌' : '✅'}
                  </span>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  ⚠️ {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#93b4d4' }}>Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#3b5f82' }}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  onFocus={e => focusStyle(e, 'password')}
                  className="w-full pl-11 pr-16 py-3 rounded-xl text-sm transition-all focus:outline-none"
                  style={inputStyle('password')}
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

              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength.score ? strength.color : '#0d3460',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strength.color }}>
                    Strength: {strength.label}
                  </p>
                </div>
              )}

              {/* Password requirements */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  {[
                    { test: form.password.length >= 8, label: 'At least 8 characters' },
                    { test: /[A-Z]/.test(form.password), label: 'One uppercase letter' },
                    { test: /[0-9]/.test(form.password), label: 'One number' },
                    { test: /[^A-Za-z0-9]/.test(form.password), label: 'One special character' },
                  ].map(req => (
                    <p key={req.label} className="text-xs flex items-center gap-1.5" style={{ color: req.test ? '#22c55e' : '#5a7fa8' }}>
                      {req.test ? '✓' : '○'} {req.label}
                    </p>
                  ))}
                </div>
              )}

              {touched.password && errors.password && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  ⚠️ {errors.password}
                </p>
              )}
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
                  Creating account...
                </span>
              ) : 'Create Account 🚀'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#3b5f82' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#facc15' }}>
              Login here
            </Link>
          </p>

          <p className="text-center text-xs mt-4" style={{ color: '#2a4a6b' }}>
            By registering you agree to our{' '}
            <span className="cursor-pointer hover:opacity-80 transition-opacity" style={{ color: '#3b5f82' }}>Terms of Service</span>
            {' '}and{' '}
            <span className="cursor-pointer hover:opacity-80 transition-opacity" style={{ color: '#3b5f82' }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}