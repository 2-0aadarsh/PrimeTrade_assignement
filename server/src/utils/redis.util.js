import redis from "../configs/redis.config.js";

const isRedisReady = () => redis.status === "ready" || redis.status === "connect";

const safelyRun = async (operation, fallbackValue = null) => {
  if (!isRedisReady()) {
    return fallbackValue;
  }

  try {
    return await operation();
  } catch (error) {
    return fallbackValue;
  }
};

export const setValue = async (key, value, ttlSeconds = null) => {
  return safelyRun(async () => {
    const normalizedValue = String(value);

    if (ttlSeconds && Number(ttlSeconds) > 0) {
      await redis.set(key, normalizedValue, "EX", Number(ttlSeconds));
      return true;
    }

    await redis.set(key, normalizedValue);
    return true;
  }, false);
};

export const getValue = async (key) => {
  return safelyRun(async () => redis.get(key), null);
};

export const setJson = async (key, value, ttlSeconds = null) => {
  return setValue(key, JSON.stringify(value), ttlSeconds);
};

export const getJson = async (key) => {
  return safelyRun(async () => {
    const raw = await redis.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  }, null);
};

export const deleteKey = async (key) => {
  return safelyRun(async () => {
    const deletedCount = await redis.del(key);
    return deletedCount > 0;
  }, false);
};

export const expireKey = async (key, ttlSeconds) => {
  return safelyRun(async () => {
    const ttl = Number(ttlSeconds);
    if (!ttl || ttl <= 0) {
      return false;
    }
    const result = await redis.expire(key, ttl);
    return result === 1;
  }, false);
};

export const incrementValue = async (key, ttlSeconds = null) => {
  return safelyRun(async () => {
    const nextValue = await redis.incr(key);

    if (nextValue === 1 && ttlSeconds && Number(ttlSeconds) > 0) {
      await redis.expire(key, Number(ttlSeconds));
    }

    return nextValue;
  }, null);
};

export const deleteKeysByPattern = async (pattern) => {
  return safelyRun(async () => {
    let cursor = "0";
    let deletedTotal = 0;

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        deletedTotal += await redis.del(...keys);
      }
    } while (cursor !== "0");

    return deletedTotal;
  }, 0);
};

export const keyExists = async (key) => {
  return safelyRun(async () => {
    const exists = await redis.exists(key);
    return exists === 1;
  }, false);
};

export const getTtl = async (key) => {
  return safelyRun(async () => redis.ttl(key), -2);
};
