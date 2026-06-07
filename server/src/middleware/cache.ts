import { Request, Response, NextFunction } from 'express';
import { localCache } from '../lib/cache';

/**
 * Express middleware to cache GET responses for a specified duration in seconds.
 * Only caches responses with 2xx status codes and JSON content-type.
 */
export const cacheMiddleware = (durationSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests to avoid caching mutations
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key based on URL path and query string
    // e.g. cache:/api/products?category=fragrances&page=1
    const cacheKey = `cache:${req.originalUrl || req.url}`;
    const cachedData = localCache.get(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cachedData);
      return;
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to cache response payload before returning it
    const originalJson = res.json;
    res.json = function (body: any): Response {
      // Only cache successful JSON payloads
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        body &&
        body.success !== false
      ) {
        localCache.set(cacheKey, body, durationSeconds);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};
