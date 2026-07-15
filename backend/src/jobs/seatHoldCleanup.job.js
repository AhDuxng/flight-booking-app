import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { bumpCacheVersion } from '../config/cache.js';

let cleanupTimer;

// Bài toán 1 - Seat Inventory & Concurrency: giải phóng các ghế held đã quá TTL bằng RPC transaction ở database.
const releaseExpiredSeatHolds = async () => {
  const { data, error } = await supabase.rpc('release_expired_held_seats');

  if (error) {
    console.error('Unable to release expired seat holds', error.message);
    return;
  }

  if (Number(data) > 0) {
    await bumpCacheVersion('flight-search');
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
