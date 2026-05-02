import mongoose from "mongoose";

const getCache = () => {
  if (!globalThis.__mongooseConnectionCache) {
    globalThis.__mongooseConnectionCache = { promise: null };
  }
  return globalThis.__mongooseConnectionCache;
};

/**
 * Reuses a single connect promise (important for Vercel serverless cold/warm invocations).
 */
export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  const cached = getCache();

  if (!cached.promise) {
    console.log("Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log("MongoDB connected successfully");
        return mongoose;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("MongoDB Connection Error:", err.message);
        throw err;
      });
  }

  return cached.promise;
};

export const disconnectDB = async () => {
  if (process.env.VERCEL === "1") {
    return;
  }

  const cached = globalThis.__mongooseConnectionCache;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    if (cached) {
      cached.promise = null;
    }
    console.log("MongoDB disconnected");
  }
};
