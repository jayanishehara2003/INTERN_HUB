const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[GATEWAY] ${req.method} ${req.originalUrl} -> ${req.url}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🎓 InternHub API Gateway is running!',
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      vacancy: process.env.VACANCY_SERVICE_URL,
      study: process.env.STUDY_SERVICE_URL,
      quiz: process.env.QUIZ_SERVICE_URL,
    }
  });
});

// Health check for all services
app.get('/health', (req, res) => {
  res.json({
    gateway: '✅ Running',
    port: process.env.PORT || 5000,
    services: {
      'auth-service': `${process.env.AUTH_SERVICE_URL}/api/auth`,
      'vacancy-service': `${process.env.VACANCY_SERVICE_URL}/api/vacancies`,
      'study-material-service': `${process.env.STUDY_SERVICE_URL}/api/materials`,
      'quiz-service': `${process.env.QUIZ_SERVICE_URL}/api/quizzes`,
    }
  });
});

// ── Route Proxies ──────────────────────────────────────

// ── Route Proxies ──────────────────────────────────────

// ── Route Proxies ──────────────────────────────────────

app.use(createProxyMiddleware({
  target: 'http://127.0.0.1:5001', // Fallback
  changeOrigin: true,
  pathFilter: (path) => path.startsWith('/api/auth'),
  pathRewrite: (path, req) => req.originalUrl,
  on: {
    error: (err, req, res) => {
      console.error(`[GATEWAY ERROR] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(503).json({ message: 'Service unavailable', error: err.message });
    },
    proxyReq: (proxyReq, req, res) => {
      console.log(`[GATEWAY PROXY] ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
    }
  }
}));

app.use(createProxyMiddleware({
  target: 'http://127.0.0.1:5002',
  changeOrigin: true,
  pathFilter: (path) => path.startsWith('/api/vacancies') || path.startsWith('/api/applications'),
  pathRewrite: (path, req) => req.originalUrl,
  on: {
    error: (err, req, res) => {
      console.error(`[GATEWAY ERROR] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(503).json({ message: 'Service unavailable', error: err.message });
    }
  }
}));

app.use(createProxyMiddleware({
  target: 'http://127.0.0.1:5003',
  changeOrigin: true,
  pathFilter: (path) => path.startsWith('/api/materials'),
  pathRewrite: (path, req) => req.originalUrl,
  on: {
    error: (err, req, res) => {
      console.error(`[GATEWAY ERROR] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(503).json({ message: 'Service unavailable', error: err.message });
    }
  }
}));

app.use(createProxyMiddleware({
  target: 'http://127.0.0.1:5004',
  changeOrigin: true,
  pathFilter: (path) => path.startsWith('/api/quizzes'),
  pathRewrite: (path, req) => req.originalUrl,
  on: {
    error: (err, req, res) => {
      console.error(`[GATEWAY ERROR] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(503).json({ message: 'Service unavailable', error: err.message });
    }
  }
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🌐 API Gateway running on port ${PORT}
─────────────────────────────────────
📍 Routes:
  /api/auth       → Auth Service      (${process.env.AUTH_SERVICE_URL})
  /api/vacancies  → Vacancy Service   (${process.env.VACANCY_SERVICE_URL})
  /api/materials  → Study Service     (${process.env.STUDY_SERVICE_URL})
  /api/quizzes    → Quiz Service      (${process.env.QUIZ_SERVICE_URL})
─────────────────────────────────────
  `);
});