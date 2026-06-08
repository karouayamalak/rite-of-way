import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import path from 'path';
import mongoose from 'mongoose';
import cluster from 'cluster';
import os from 'os';

import { connectDB } from './lib/db';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import uploadRoutes from './routes/upload.routes';
import couponRoutes from './routes/coupon.routes';
import analyticsRoutes from './routes/analytics.routes';
import categoryRoutes from './routes/category.routes';
import settingsRoutes from './routes/settings.routes';
import activityRoutes from './routes/activity.routes';
import wilayaRoutes from './routes/wilaya.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Compression (gzip/brotli) — must be first middleware ---
app.use(compression({
  level: 6,          // balanced speed vs ratio (default is 6)
  threshold: 1024,   // only compress responses larger than 1kb
}));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
// Database connection middleware optimized for high concurrency
app.use((_req, _res, next) => {
  // If already connected, pass through synchronously to bypass microtask scheduling latency
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  // Fallback to connection logic for serverless cold-starts
  connectDB()
    .then(() => next())
    .catch(next);
});

// --- Rate limiting: hard block after 1000 req / 15 min per IP ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// --- Slow-down: start adding delay after 200 req / 15 min per IP ---
// This gracefully degrades heavy clients instead of hard-blocking them.
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 200,
  delayMs: (hits) => (hits - 200) * 100, // 100ms per extra req above threshold
  maxDelayMs: 5000,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);
app.use('/api/auth', authLimiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const uploadsPath = path.join(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Rite of Way API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/activity-logs', activityRoutes);
app.use('/api/wilayas', wilayaRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const startServer = async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && cluster.isPrimary) {
    const numCPUs = os.cpus().length || 1;
    console.log(`\n👑 Primary process ${process.pid} is running in production mode.`);
    console.log(`Spawning ${numCPUs} worker processes for CPU clustering...\n`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker) => {
      console.warn(`⚠️ Worker process ${worker.process.pid} died. Spawning a new worker...`);
      cluster.fork();
    });
  } else {
    await connectDB();
    app.listen(PORT, () => {
      const prefix = isProduction ? `👷 Worker process ${process.pid} -` : '🚀';
      console.log(`\n${prefix} Rite of Way API running at http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 CORS allowed for: ${process.env.CLIENT_URL}\n`);
    });
  }
};

startServer();

export default app;
