// Simple in-memory cache implementation
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Would need to track hits/misses for accurate hit rate
    };
  }

  // Clean up expired items
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Create cache instances for different data types
export const searchCache = new MemoryCache(500, 300000); // 5 minutes TTL for search results
export const productCache = new MemoryCache(100, 600000); // 10 minutes TTL for product data
export const aiResponseCache = new MemoryCache(200, 180000); // 3 minutes TTL for AI responses

// Cache key generators
export const generateSearchKey = (query: string): string => {
  return `search:${query.toLowerCase().trim()}`;
};

export const generateProductKey = (productId: string): string => {
  return `product:${productId}`;
};

export const generateAIResponseKey = (query: string, productIds: string[]): string => {
  const sortedIds = productIds.sort().join(',');
  return `ai:${query.toLowerCase().trim()}:${sortedIds}`;
};

// Cache middleware for Express
export const cacheMiddleware = (cache: MemoryCache, keyGenerator: (req: any) => string) => {
  return (req: any, res: any, next: any) => {
    const key = keyGenerator(req);
    const cached = cache.get(key);

    if (cached) {
      console.log(`🎯 Cache hit for key: ${key}`);
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data: any) {
      cache.set(key, data);
      console.log(`💾 Cached response for key: ${key}`);
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cleanup expired cache items every 5 minutes
setInterval(() => {
  const searchCleaned = searchCache.cleanup();
  const productCleaned = productCache.cleanup();
  const aiCleaned = aiResponseCache.cleanup();
  
  if (searchCleaned + productCleaned + aiCleaned > 0) {
    console.log(`🧹 Cache cleanup: removed ${searchCleaned + productCleaned + aiCleaned} expired items`);
  }
}, 300000); // 5 minutes

export default MemoryCache;

