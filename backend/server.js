import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Import middlewares
import { generalLimiter, authLimiter } from './middleware/rateLimit.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { sanitizeBody, sanitizeQuery } from './middleware/sanitize.js';


// Load environment variables and connect to database
dotenv.config();

const app = express();
connectDB();



// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL ,
  credentials: true
}));

// Rate Limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// Request logging
app.use(requestLogger);

// Body Parsing & Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);
app.use(sanitizeQuery);


// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 NutriDeliver Backend is running successfully!',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use(notFound);

// Error logging
app.use(errorLogger);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;