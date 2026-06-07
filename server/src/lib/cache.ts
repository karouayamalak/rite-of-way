interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class LocalCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes to clear expired entries and prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Set a value in the cache with a specified TTL (in seconds)
   */
  public set<T>(key: string, value: T, ttlSeconds: number): void {
    if (ttlSeconds <= 0) return;
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache. Returns null if key doesn't exist or is expired.
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Delete a key from the cache
   */
  public del(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching a regular expression pattern
   */
  public deletePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  public flush(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired cache items to free up memory
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop cleanup timers (useful for tests or hot reloads)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const localCache = new LocalCache();
