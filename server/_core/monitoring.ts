import { Request, Response, NextFunction } from "express";

/**
 * Performance monitoring and metrics collection
 * Tracks response times, error rates, and system health
 */

interface MetricsSnapshot {
  timestamp: Date;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  dbQueryTime: number;
  cacheHitRate: number;
}

class PerformanceMonitor {
  private requests: number = 0;
  private errors: number = 0;
  private responseTimes: number[] = [];
  private dbQueryTimes: number[] = [];
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  recordRequest(responseTime: number, isError: boolean = false) {
    this.requests++;
    this.responseTimes.push(responseTime);

    if (isError) {
      this.errors++;
    }

    // Keep only last 1000 samples for memory efficiency
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  recordDbQuery(queryTime: number) {
    this.dbQueryTimes.push(queryTime);

    if (this.dbQueryTimes.length > 1000) {
      this.dbQueryTimes.shift();
    }
  }

  recordCacheHit() {
    this.cacheHits++;
  }

  recordCacheMiss() {
    this.cacheMisses++;
  }

  getMetrics(): MetricsSnapshot {
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const dbSorted = [...this.dbQueryTimes].sort((a, b) => a - b);

    return {
      timestamp: new Date(),
      requestCount: this.requests,
      errorCount: this.errors,
      avgResponseTime: sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0,
      p95ResponseTime: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99ResponseTime: sorted[Math.floor(sorted.length * 0.99)] || 0,
      dbQueryTime: dbSorted.length > 0 ? dbSorted.reduce((a, b) => a + b, 0) / dbSorted.length : 0,
      cacheHitRate: this.cacheHits + this.cacheMisses > 0 ? this.cacheHits / (this.cacheHits + this.cacheMisses) : 0,
    };
  }

  reset() {
    this.requests = 0;
    this.errors = 0;
    this.responseTimes = [];
    this.dbQueryTimes = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

const monitor = new PerformanceMonitor();

/**
 * Express middleware for request timing
 */
export function performanceMonitoringMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;

    monitor.recordRequest(responseTime, isError);

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`[Performance] Slow request: ${req.method} ${req.path} (${responseTime}ms)`);
    }
  });

  next();
}

/**
 * Structured logging with context
 */
export function createLogger(context: string) {
  return {
    info: (message: string, data?: any) => {
      console.log(JSON.stringify({ level: "info", context, message, data, timestamp: new Date() }));
    },
    warn: (message: string, data?: any) => {
      console.warn(JSON.stringify({ level: "warn", context, message, data, timestamp: new Date() }));
    },
    error: (message: string, error?: any) => {
      console.error(
        JSON.stringify({
          level: "error",
          context,
          message,
          error: error?.message || error,
          stack: error?.stack,
          timestamp: new Date(),
        })
      );
    },
  };
}

/**
 * Health check endpoint data
 */
export function getHealthStatus() {
  const metrics = monitor.getMetrics();

  return {
    status: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics,
    checks: {
      requestsPerSecond: (metrics.requestCount / (process.uptime() || 1)).toFixed(2),
      errorRate: ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) + "%",
      avgResponseTime: metrics.avgResponseTime.toFixed(2) + "ms",
      cacheHitRate: (metrics.cacheHitRate * 100).toFixed(2) + "%",
    },
  };
}

/**
 * Export monitor for external use
 */
export { monitor };
