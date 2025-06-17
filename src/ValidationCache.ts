import {ApiValidateResponse} from './Model/Api/ValidateResponse';
import {log} from './Logger';

interface CachedValidationResponse {
  response: ApiValidateResponse;
  timestamp: number;
}

export class ValidationCache {
  private static instance: ValidationCache;
  private cache: Map<string, CachedValidationResponse> = new Map();
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ValidationCache {
    if (!ValidationCache.instance) {
      ValidationCache.instance = new ValidationCache();
    }
    return ValidationCache.instance;
  }

  /**
   * Get cached validation response if still valid
   */
  public getCachedResponse(secretKey: string): ApiValidateResponse | null {
    const cacheKey = this.getCacheKey(secretKey);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      log('ValidationCache: No cached response found');
      return null;
    }

    const now = Date.now();
    const isExpired = (now - cached.timestamp) > this.CACHE_DURATION_MS;

    if (isExpired) {
      log('ValidationCache: Cached response expired, removing from cache');
      this.cache.delete(cacheKey);
      return null;
    }

    log('ValidationCache: Returning cached response', {
      cachedAt: new Date(cached.timestamp),
      expiresAt: new Date(cached.timestamp + this.CACHE_DURATION_MS),
      isActive: cached.response.isSubscriptionActive()
    });

    return cached.response;
  }

  /**
   * Store validation response in cache
   */
  public setCachedResponse(secretKey: string, response: ApiValidateResponse): void {
    const cacheKey = this.getCacheKey(secretKey);
    const cached: CachedValidationResponse = {
      response,
      timestamp: Date.now()
    };

    this.cache.set(cacheKey, cached);

    log('ValidationCache: Stored response in cache', {
      isActive: response.isSubscriptionActive(),
      cachedAt: new Date(cached.timestamp),
      expiresAt: new Date(cached.timestamp + this.CACHE_DURATION_MS)
    });
  }

  /**
   * Check if cached response exists and is valid
   */
  public isCacheValid(secretKey: string): boolean {
    return this.getCachedResponse(secretKey) !== null;
  }

  /**
   * Clear cache for a specific secret key
   */
  public clearCache(secretKey: string): void {
    const cacheKey = this.getCacheKey(secretKey);
    this.cache.delete(cacheKey);
    log('ValidationCache: Cleared cache for secret key');
  }

  /**
   * Clear entire cache
   */
  public clearAllCache(): void {
    this.cache.clear();
    log('ValidationCache: Cleared all cache');
  }

  /**
   * Get time remaining until cache expires (in ms)
   */
  public getTimeUntilExpiry(secretKey: string): number {
    const cacheKey = this.getCacheKey(secretKey);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return 0;
    }

    const now = Date.now();
    const expiryTime = cached.timestamp + this.CACHE_DURATION_MS;
    const timeRemaining = Math.max(0, expiryTime - now);

    return timeRemaining;
  }

  private getCacheKey(secretKey: string): string {
    // Use a hash of the secret key for security
    return `validation_${this.simpleHash(secretKey)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}