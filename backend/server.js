// Environment variables are preloaded via --import ./loadEnv.js in package.json
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import templateRoutes from './routes/templates.js';
import worksheetRoutes from './routes/worksheets.js';
import testRoutes from './routes/test.js';
import adminRoutes from './routes/admin.js';
import universityRoutes from './university/routes.js';

const app = express();

// Force restart for CORS check

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development (reduce for production)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Security & Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",   // testing ke liye temporarily
  })
);


app.use(limiter); // Apply rate limiting to all routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/worksheets', worksheetRoutes);
app.use('/api/test', testRoutes);


// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Worksheet AI System API is running',
    timestamp: new Date().toISOString()
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
});

export default app;
