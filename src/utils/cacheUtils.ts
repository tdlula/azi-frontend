// Cache utilities for persistent storage across page refreshes
export interface CacheData {
  data: any;
  timestamp: number;
  topic: string;
  dateRange: string;
}

const CACHE_PREFIX = 'azi-dashboard-';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class CacheManager {
  // Save data to localStorage with expiration
  static saveToCache(key: string, data: any, topic: string = 'general', dateRange: string = 'default'): void {
    try {
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
        topic,
        dateRange
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
      console.log('💾 Saved to localStorage cache:', key);
    } catch (error) {
      console.warn('Failed to save to localStorage cache:', error);
    }
  }

  // Get data from localStorage if still valid
  static getFromCache(key: string): any | null {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        console.log('🗑️ Expired cache removed:', key);
        return null;
      }

      console.log('💾 Retrieved from localStorage cache:', key, {
        age: Math.round((Date.now() - cacheData.timestamp) / 1000) + 's',
        topic: cacheData.topic,
        dateRange: cacheData.dateRange
      });
      return cacheData.data;
    } catch (error) {
      console.warn('Failed to get from localStorage cache:', error);
      return null;
    }
  }

  // Clear specific cache entry
  static clearCache(key: string): void {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      console.log('🗑️ Cleared cache:', key);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Clear all dashboard cache
  static clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      console.log('🗑️ Cleared all dashboard cache:', keys.length, 'items');
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  // Get cache statistics
  static getCacheStats(): { count: number; totalSize: number; items: Array<{ key: string; age: number; size: number }> } {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
      let totalSize = 0;
      const items = keys.map(key => {
        const data = localStorage.getItem(key) || '';
        const size = data.length;
        totalSize += size;
        
        try {
          const cacheData: CacheData = JSON.parse(data);
          return {
            key: key.replace(CACHE_PREFIX, ''),
            age: Date.now() - cacheData.timestamp,
            size
          };
        } catch {
          return { key: key.replace(CACHE_PREFIX, ''), age: 0, size };
        }
      });

      return { count: keys.length, totalSize, items };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { count: 0, totalSize: 0, items: [] };
    }
  }

  // Generate cache key based on topic and date range
  static generateCacheKey(type: 'dashboard' | 'wordcloud', topic: string = 'general', dateRange?: { from: Date; to: Date }): string {
    const dateKey = dateRange 
      ? `${dateRange.from.toISOString().split('T')[0]}-${dateRange.to.toISOString().split('T')[0]}`
      : 'default';
    return `${type}-${topic}-${dateKey}`;
  }
}
