import { createClient } from 'redis';
import { randomUUID } from 'node:crypto';
import { env } from './env.js';

let client;
let connectionPromise;
let retryAt = 0;

const REDIS_TIMEOUT_MS = 1_000;
const REDIS_RETRY_DELAY_MS = 30_000;

const withTimeout = async (promise, fallback = null) => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), REDIS_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const closeClient = () => {
  if (!client) {
    return;
  }

  const currentClient = client;
  client = null;

  try {
    Promise.resolve(currentClient.disconnect()).catch(() => {});
  } catch {
    return;
  }
};

const getClient = async () => {
  if (!env.redisUrl || Date.now() < retryAt) {
    return null;
  }

  if (client?.isReady) {
    return client;
  }

  if (!connectionPromise) {
    client = createClient({
      url: env.redisUrl,
      socket: {
        connectTimeout: REDIS_TIMEOUT_MS,
        reconnectStrategy: false,
      },
    });
    client.on('error', () => {});
    connectionPromise = withTimeout(client.connect())
      .catch(() => null)
      .then(() => {
        if (!client?.isReady) {
          retryAt = Date.now() + REDIS_RETRY_DELAY_MS;
          closeClient();
        }
      })
      .finally(() => {
        connectionPromise = null;
      });
  }

  await connectionPromise;
  return client?.isReady ? client : null;
};

// Bài toán 2 - Flight Search & Caching: đọc cache Redis trước để giảm tải read database.
export const getCachedJson = async (key) => {
  const redis = await getClient();

  if (!redis) {
    return null;
  }

  try {
    const value = await withTimeout(redis.get(key));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

// Bài toán 2 - Flight Search & Caching: cache ngắn hạn, Redis lỗi thì bỏ qua để API vẫn hoạt động.
export const setCachedJson = async (key, value, ttlSeconds) => {
  const redis = await getClient();

  if (!redis) {
    return;
  }

  try {
    await withTimeout(redis.set(key, JSON.stringify(value), { EX: ttlSeconds }));
  } catch {
    return;
  }
};

// Bài toán 2 - Cache invalidation: tăng version để vô hiệu toàn bộ cache tìm kiếm mà không cần Redis SCAN.
export const getCacheVersion = async (scope) => {
  const redis = await getClient();

  if (!redis) {
    return '0';
  }

  try {
    return (await withTimeout(redis.get(`cache-version:${scope}`))) ?? '0';
  } catch {
    return '0';
  }
};

// Bài toán 2 - Cache invalidation: mọi thay đổi tồn ghế hoặc chuyến bay sẽ tạo cache key phiên bản mới.
export const bumpCacheVersion = async (scope) => {
  const redis = await getClient();

  if (!redis) {
    return;
  }

  try {
    await withTimeout(redis.incr(`cache-version:${scope}`));
  } catch {
    return;
  }
};

// Bài toán 1 - Seat Inventory & Concurrency: chỉ xóa Redis lock nếu token vẫn thuộc request hiện tại, tránh xóa lock của request khác.
const releaseLock = async (redis, key, token) => {
  try {
    await withTimeout(
      redis.eval(
        'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) end return 0',
        { keys: [key], arguments: [token] },
      ),
    );
  } catch {
    return;
  }
};

// Bài toán 1 - Seat Inventory & Concurrency: Redis soft lock chặn request trùng; transaction Postgres vẫn là nguồn sự thật khi Redis lỗi hoặc lock hết hạn.
export const withRedisLocks = async (keys, task) => {
  const redis = await getClient();

  if (!redis) {
    return task();
  }

  const token = randomUUID();
  const lockKeys = [...new Set(keys)].sort().map((key) => `seat-lock:${key}`);
  const acquiredKeys = [];

  try {
    for (const key of lockKeys) {
      const acquired = await withTimeout(redis.set(key, token, { NX: true, PX: 5_000 }));

      if (!acquired) {
        throw Object.assign(new Error('Seat selection is being processed. Please try again'), { status: 409 });
      }

      acquiredKeys.push(key);
    }

    return await task();
  } finally {
    await Promise.all(acquiredKeys.map((key) => releaseLock(redis, key, token)));
  }
};
