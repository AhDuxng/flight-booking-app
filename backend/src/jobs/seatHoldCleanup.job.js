import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { bumpCacheVersion } from '../config/cache.js';
import { logger } from '../utils/logger.js';

let cleanupTimer;

// Bài toán 1 - Seat Inventory & Concurrency: giải phóng các ghế held đã quá TTL bằng RPC transaction ở database.
const releaseExpiredSeatHolds = async () => {
  const [seatResult, changeResult] = await Promise.all([
    supabase.rpc('release_expired_held_seats'),
    supabase.rpc('expire_stale_flight_change_quotes_v2'),
  ]);

  if (seatResult.error) {
    logger.error('seat_hold_cleanup_failed', { error: seatResult.error.message });
  }
  if (changeResult.error) {
    logger.error('flight_change_quote_cleanup_failed', { error: changeResult.error.message });
  }
  if (Number(seatResult.data) > 0) {
    logger.info('seat_holds_expired', { released_seats: Number(seatResult.data) });
    await bumpCacheVersion('flight-search');
  }
  if (Number(changeResult.data) > 0) {
    logger.info('flight_change_quotes_expired', { expired_quotes: Number(changeResult.data) });
  }
};

// Bài toán 1 - Seat Inventory & Concurrency: mỗi instance có thể chạy job; SQL dùng SKIP LOCKED nên an toàn khi scale ngang.
export const startSeatHoldCleanupJob = () => {
  if (env.nodeEnv === 'test' || cleanupTimer) {
    return;
  }

  void releaseExpiredSeatHolds();
  cleanupTimer = setInterval(() => {
    void releaseExpiredSeatHolds();
  }, env.seatCleanupIntervalMs);
  cleanupTimer.unref();
};
