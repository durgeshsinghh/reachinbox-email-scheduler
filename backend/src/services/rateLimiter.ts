import { getRedisConnection } from '../config/redis';
import { RateLimitResult } from '../types';
import Redis from 'ioredis';

class RateLimiterService {
  private static instance: RateLimiterService;
  private redis: Redis;

  private constructor() {
    this.redis = getRedisConnection();
  }

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  public async checkAndIncrement(senderEmail: string, maxPerHour: number): Promise<RateLimitResult> {
    const hourWindow = Math.floor(Date.now() / 3600000);
    const key = `rate:${senderEmail}:${hourWindow}`;

    const [countResult] = await this.redis.multi().incr(key).expire(key, 3600).exec() as any;
    const currentCount = countResult[1] as number;

    if (currentCount > maxPerHour) {
      const nextHour = (hourWindow + 1) * 3600000;
      const retryAfterMs = nextHour - Date.now();
      return { allowed: false, currentCount, retryAfterMs };
    }

    return { allowed: true, currentCount, retryAfterMs: 0 };
  }

  public async getCurrentCount(senderEmail: string): Promise<number> {
    const hourWindow = Math.floor(Date.now() / 3600000);
    const key = `rate:${senderEmail}:${hourWindow}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }
}

export const rateLimiterService = RateLimiterService.getInstance();
