import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import validateEnv from './config/env.js';

// Validate environment variables
validateEnv();

// Route Imports
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import adminRoutes from './routes/admin.js';
import bookingRoutes from './routes/bookings.js';
import ownerRoutes from './routes/owner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust Render's proxy for Rate Limiting
app.set('trust proxy', 1);

// Essential Middleware
app.use(cors());
app.use(express.json());

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  // unsafe-none is required to fix COOP issues with Firebase popups
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/owner', ownerRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err.stack);
  res.status(500).json({ 
    msg: 'An internal server error occurred', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});
