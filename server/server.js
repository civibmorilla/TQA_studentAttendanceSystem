const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const termRoutes = require('./routes/termRoutes');
const excuseRoutes = require('./routes/excuseRoutes');

dotenv.config();
const app = express();

// Render / Vercel sit behind a proxy: needed so rate limits see the real client IP
app.set('trust proxy', 1);

// Standard security headers (no-sniff, frame protection, HSTS, ...)
app.use(helmet());

// CORS: only our own front-end may call the API from a browser.
// CLIENT_URL can hold several origins separated by commas.
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL || '').split(',').map((s) => s.trim())
].filter(Boolean);

// SECURITY FIX: previously ANY *.vercel.app site was allowed. Preview deployments
// can still be enabled explicitly for testing with ALLOW_VERCEL_PREVIEWS=true.
const allowPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (allowPreviews && origin.endsWith('.vercel.app')) return callback(null, true);
    console.log('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academic', programRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/terms', termRoutes);
app.use('/api/v1/excuses', excuseRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ClassPulse API is running' });
});

// Unknown API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Errors thrown by middleware (e.g. CORS, bad JSON)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.message === 'Not allowed by CORS' ? 403 : err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
