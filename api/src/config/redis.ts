import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (err: unknown) => {
  logger.error({ err }, "Redis connection error");
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info("Redis disconnected gracefully");
}
