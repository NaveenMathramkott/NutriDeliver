import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/database.js';

// Import middlewares
import { generalLimiter, authLimiter } from './middleware/rateLimit.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { sanitizeBody, sanitizeQuery } from './middleware/sanitize.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import restaurantRoutes from './routes/restaurants.js';
import foodRoutes from './routes/food.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import offerRoutes from './routes/offers.js';
import notificationRoutes from './routes/notifications.js';
import riderRoutes from './routes/riders.js';
import adminRoutes from './routes/admin.js';

const app = express();
connectDB();



// Security Middleware
app.use(helmet());
app.use(cors({
 origin: process.env.CLIENT_URL,
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


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/riders', riderRoutes);

app.use('/api/food', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
 res.status(200).json({
  success: true,
  message: '🚀 NutriDeliver Backend is running successfully!',
  timestamp: new Date().toISOString(),
  version: '1.0.0'
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
 console.log(`🎯 Server running on port ${PORT} --**`);
 console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'} --**`);
 console.log(`📚 API Documentation: http://localhost:${PORT}/api/health --**`);
});

export default app;