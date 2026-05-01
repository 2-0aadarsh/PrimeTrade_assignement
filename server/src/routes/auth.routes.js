import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  refreshToken,
  register,
  resendEmailOtp,
  resetPassword,
  updateMe,
  verifyEmailOtp,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { createSlidingWindowRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRefreshToken,
  validateRegister,
  validateResendEmailOtp,
  validateResetPassword,
  validateUpdateProfile,
  validateVerifyEmailOtp,
} from "../validators/auth.validator.js";

const authRouter = Router();
const authRateLimitWindowMs = Number(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000
);
const authRateLimitMaxRequests = Number(
  process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 25
);
const authRateLimiter = createSlidingWindowRateLimiter({
  keyPrefix: "rate-limit:auth",
  windowMs: authRateLimitWindowMs,
  maxRequests: authRateLimitMaxRequests,
  message: "Too many auth attempts. Please try again later.",
});

authRouter.post("/register", authRateLimiter, validateRequest(validateRegister), register);
authRouter.post(
  "/verify-email-otp",
  authRateLimiter,
  validateRequest(validateVerifyEmailOtp),
  verifyEmailOtp
);
authRouter.post(
  "/resend-email-otp",
  authRateLimiter,
  validateRequest(validateResendEmailOtp),
  resendEmailOtp
);
authRouter.post("/login", authRateLimiter, validateRequest(validateLogin), login);
authRouter.post(
  "/refresh-token",
  authRateLimiter,
  validateRequest(validateRefreshToken),
  refreshToken
);
authRouter.post("/logout", authRateLimiter, validateRequest(validateRefreshToken), logout);
authRouter.get("/me", protect, getMe);
authRouter.patch("/me", protect, validateRequest(validateUpdateProfile), updateMe);
authRouter.patch(
  "/change-password",
  protect,
  validateRequest(validateChangePassword),
  changePassword
);
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest(validateForgotPassword),
  forgotPassword
);
authRouter.post(
  "/reset-password",
  authRateLimiter,
  validateRequest(validateResetPassword),
  resetPassword
);

export default authRouter;
