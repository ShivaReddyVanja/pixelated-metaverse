// src/services/redis.ts
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient) return redisClient;

  const isProd = process.env.ENV === 'prod';

  redisClient = createClient(
    isProd ? {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT! || '6379', 10),
        tls: true
      }
    } : {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }
  );

  redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  await redisClient.connect();

  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
