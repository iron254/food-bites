import Redis from "ioredis";

/**
 * Redis caching layer for scalability
 * Reduces database load by caching frequently accessed data
 */

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    });

    redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err);
    });

    redis.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });
  }

  return redis;
}

/**
 * Cache key generators for consistency
 */
export const cacheKeys = {
  restaurants: () => "restaurants:all",
  restaurant: (id: number) => `restaurant:${id}`,
  restaurantMenu: (id: number) => `restaurant:${id}:menu`,
  userBookmarks: (userId: number) => `user:${userId}:bookmarks`,
  orderStatus: (orderId: number) => `order:${orderId}:status`,
  userOrders: (userId: number) => `user:${userId}:orders`,
  financialSummary: (startDate?: Date, endDate?: Date) =>
    `financial:summary:${startDate?.getTime() || "all"}:${endDate?.getTime() || "all"}`,
  dailyRevenue: (startDate?: Date, endDate?: Date) =>
    `financial:daily:${startDate?.getTime() || "all"}:${endDate?.getTime() || "all"}`,
};

/**
 * Cache operations with TTL
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error("[Cache] Get error:", error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error("[Cache] Set error:", error);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    const client = getRedisClient();
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error("[Cache] Delete error:", error);
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error("[Cache] Pattern invalidation error:", error);
  }
}

/**
 * Cache statistics for monitoring
 */
export async function getCacheStats() {
  try {
    const client = getRedisClient();
    const info = await client.info("stats");
    return {
      connected: client.status === "ready",
      info,
    };
  } catch (error) {
    console.error("[Cache] Stats error:", error);
    return { connected: false, error };
  }
}

/**
 * Graceful shutdown
 */
export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Request deduplication for expensive operations
 * Prevents duplicate requests from hitting the database simultaneously
 */
const requestCache = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key)!;
  }

  const promise = fn().finally(() => {
    requestCache.delete(key);
  });

  requestCache.set(key, promise);
  return promise;
}
