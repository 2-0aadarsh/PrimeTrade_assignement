/**
 * Vercel serverless entry: re-export the Express app (no app.listen).
 * Set Root Directory to `server` in Vercel and configure env + CORS_ORIGINS.
 */
import app from "../src/server.js";

export default app;
