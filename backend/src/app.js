import 'express-async-errors'; // Tự động bắt lỗi trong async/await controller mà không cần try/catch thủ công
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();

// 1. Bảo mật HTTP Headers với Helmet
app.use(helmet());

// 2. Cấu hình CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Cho phép gửi gửi cookie qua CORS
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Phân tích dữ liệu request (Parsing)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Nén payload response & Ghi log HTTP requests
app.use(compression());
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Áp dụng giới hạn tần suất request chung
app.use('/api', apiLimiter);

// 6. Gắn kết hệ thống Routes chính
app.use('/api', routes);

// Route kiểm tra sức khỏe hệ thống (Health Check)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 7. Xử lý lỗi 404 (Route không tồn tại)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy đường dẫn ${req.originalUrl} trên máy chủ.`,
  });
});

// 8. Middleware xử lý lỗi toàn cục (Global Error Handler)
app.use((err, req, res, next) => {
  console.error('❌ Lỗi hệ thống:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
