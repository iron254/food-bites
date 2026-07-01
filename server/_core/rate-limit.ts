import { Request, Response, NextFunction } from "express";
import { getRedisClient } from "./cache";

/**
 * Rate limiting middleware for API protection
 * Prevents abuse and ensures fair resource allocation
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => req.ip || "unknown",
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redis = getRedisClient();
      const key = `ratelimit:${finalConfig.keyGenerator!(req)}`;

      const current = await redis.incr(key);

      if (current === 1) {
        // Set expiry on first request
        await redis.expire(key, Math.ceil(finalConfig.windowMs / 1000));
      }

      res.set("X-RateLimit-Limit", finalConfig.maxRequests.toString());
      res.set("X-RateLimit-Remaining", Math.max(0, finalConfig.maxRequests - current).toString());
      res.set("X-RateLimit-Reset", new Date(Date.now() + finalConfig.windowMs).toISOString());

      if (current > finalConfig.maxRequests) {
        return res.status(429).json({
          error: "Too many requests",
          retryAfter: finalConfig.windowMs / 1000,
        });
      }

      next();
    } catch (error) {
      console.error("[RateLimit] Error:", error);
      // On error, allow request to proceed
      next();
    }
  };
}

/**
 * Per-user rate limiting for authenticated requests
 */
export function createUserRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = {
    ...defaultConfig,
    maxRequests: 1000, // Higher limit for authenticated users
    keyGenerator: (req: Request & { user?: { id: number } }) => `user:${(req as any).user?.id || "unknown"}`,
    ...config,
  };

  return createRateLimiter(finalConfig);
}

/**
 * Endpoint-specific rate limiting
 */
export function createEndpointRateLimiter(
  endpoint: string,
  config: Partial<RateLimitConfig> = {}
) {
  const finalConfig = {
    ...defaultConfig,
    keyGenerator: (req: Request) => `endpoint:${endpoint}:${req.ip || "unknown"}`,
    ...config,
  };

  return createRateLimiter(finalConfig);
}

/**
 * Sliding window rate limiting for better distribution
 */
export async function checkSlidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const redis = getRedisClient();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await redis.zcard(key);

    if (count >= maxRequests) {
      // Get oldest request time for reset calculation
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const resetAt = oldest.length > 0 ? new Date(parseInt(oldest[1]) + windowMs) : new Date();

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      resetAt: new Date(now + windowMs),
    };
  } catch (error) {
    console.error("[SlidingWindow] Error:", error);
    // On error, allow request
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(),
    };
  }
}
