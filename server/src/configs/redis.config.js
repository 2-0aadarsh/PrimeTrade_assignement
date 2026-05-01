import Redis from "ioredis";

const redisPort = Number(process.env.REDIS_PORT || 6379);

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number.isNaN(redisPort) ? 6379 : redisPort,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("error", (error) => {
  console.warn("Redis connection error:", error.message);
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("ready", () => {
  console.log("Redis is ready");
});

export const disconnectRedis = async () => {
  if (redis.status === "ready" || redis.status === "connect") {
    await redis.quit();
    console.log("Redis disconnected");
  }
};

export default redis;