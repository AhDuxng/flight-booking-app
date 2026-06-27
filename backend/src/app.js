import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import 'express-async-errors';

import env from './config/env.js';
import rateLimiter from './middlewares/rateLimiter.middleware.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(helmet());

const corsOptions = {
  origin: env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limiting
app.use(rateLimiter);

// API Route version 1
app.use('/api/v1', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
