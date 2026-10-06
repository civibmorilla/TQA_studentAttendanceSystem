const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

dotenv.config();
const app = express();

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow mobile, postman, server-to-server or matching origins
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanClient = clientOrigin.replace(/\/$/, '');
    if (cleanOrigin === cleanClient || cleanOrigin.includes('localhost') || cleanOrigin.includes('vercel.app') || cleanOrigin.includes('onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academic', programRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ClassPulse API by XI Labs is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));