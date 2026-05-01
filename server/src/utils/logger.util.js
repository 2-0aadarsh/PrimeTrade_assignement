const buildLogLine = (level, message, meta = {}) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
};

export const logger = {
  info(message, meta = {}) {
    console.log(buildLogLine("info", message, meta));
  },
  warn(message, meta = {}) {
    console.warn(buildLogLine("warn", message, meta));
  },
  error(message, meta = {}) {
    console.error(buildLogLine("error", message, meta));
  },
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === "development") {
      console.debug(buildLogLine("debug", message, meta));
    }
  },
};
