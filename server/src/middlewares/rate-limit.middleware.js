import redis from "../configs/redis.config.js";
import { logger } from "../utils/logger.util.js";

const isRedisReady = () => redis.status === "ready" || redis.status === "connect";

const getClientIp = (req) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.length > 0) {
    return xForwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

export const createSlidingWindowRateLimiter = ({
  keyPrefix,
  windowMs,
  maxRequests,
  message = "Too many requests. Please try again later.",
  keyGenerator,
}) => {
  return async (req, res, next) => {
    if (!isRedisReady()) {
      return next();
    }

    const identifier = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      const pipeline = redis.multi();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, member);
      pipeline.zcard(key);
      pipeline.pexpire(key, windowMs);

      const [, , countResult] = await pipeline.exec();
      const totalRequests = Number(countResult[1] || 0);
      const remaining = Math.max(maxRequests - totalRequests, 0);

      res.setHeader("x-ratelimit-limit", String(maxRequests));
      res.setHeader("x-ratelimit-remaining", String(remaining));
      res.setHeader("x-ratelimit-window-ms", String(windowMs));

      if (totalRequests > maxRequests) {
        return res.status(429).json({
          success: false,
          message,
        });
      }

      return next();
    } catch (error) {
      logger.error("Rate limiter failed, allowing request", {
        keyPrefix,
        error: error.message,
      });
      return next();
    }
  };
};
