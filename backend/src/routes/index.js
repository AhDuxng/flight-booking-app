import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';

const router = express.Router();

// Gắn các route của module Auth vào đường dẫn /api/auth
router.use('/auth', authRoutes);

// Có thể mở rộng gắn các module khác tại đây (flights, bookings, users...) trong tương lai

export default router;
