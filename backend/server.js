require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Startup Check: Essential Environment Configuration
const essentialConfigs = ['JWT_SECRET', 'MONGODB_URI'];
essentialConfigs.forEach(conf => {
  if (!process.env[conf]) {
    console.error(`\x1b[41m CRITICAL CONFIG ERROR: \x1b[0m Missing ${conf} environment variable!`);
    console.error('SERVER WILL LIKELY FAIL IN PRODUCTION MODES.');
  }
});

// Essential Middleware (MUST BE FIRST)
app.use(cors());
app.use(express.json());

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting (Bumped for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maprent')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bookings', require('./routes/bookings'));
const PORT = process.env.PORT || 5050;

// Global Error Handler for Express
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  console.error('[SERVER EXCEPTION]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({ 
    msg: 'An internal server error occurred', 
    error: isDev ? err.message : 'System fault detected',
    id: Date.now().toString().slice(-6) // Correlation ID for logs
  });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

process.on('unhandledRejection', (reason, promise) => {
  console.error('SYSTEM ALERT: Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('CRITICAL SYSTEM ERROR: Uncaught Exception:', err);
  setTimeout(() => process.exit(1), 100);
});
