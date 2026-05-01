import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import { deleteKey, getValue, incrementValue, setValue } from "../utils/redis.util.js";
import {
  sendPasswordResetEmail,
  sendVerificationOtpEmail,
} from "../utils/email.util.js";

const EMAIL_OTP_TTL_SECONDS = Number(process.env.EMAIL_OTP_TTL_SECONDS || 600);
const EMAIL_OTP_ATTEMPT_LIMIT = Number(process.env.EMAIL_OTP_ATTEMPT_LIMIT || 5);
const EMAIL_OTP_COOLDOWN_SECONDS = Number(
  process.env.EMAIL_OTP_COOLDOWN_SECONDS || 60
);
const RESET_TOKEN_TTL_SECONDS = Number(process.env.RESET_TOKEN_TTL_SECONDS || 900);
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || "otp-secret";
const REFRESH_TOKEN_TTL_SECONDS = Number(
  process.env.REFRESH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7
);
const REFRESH_TOKEN_HASH_SECRET =
  process.env.REFRESH_TOKEN_HASH_SECRET || "refresh-secret";

const getEmailOtpKey = (email) => `auth:email-otp:${email}`;
const getEmailOtpAttemptKey = (email) => `auth:email-otp-attempts:${email}`;
const getEmailOtpCooldownKey = (email) => `auth:email-otp-cooldown:${email}`;
const getResetTokenKey = (email) => `auth:reset-token:${email}`;

const hashSensitiveValue = (rawValue) => {
  return crypto.createHash("sha256").update(`${rawValue}.${OTP_HASH_SECRET}`).digest("hex");
};

const generateOtp = () => {
  return String(crypto.randomInt(100000, 1000000));
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex");
};

const hashRefreshToken = (rawValue) => {
  return crypto
    .createHash("sha256")
    .update(`${rawValue}.${REFRESH_TOKEN_HASH_SECRET}`)
    .digest("hex");
};

const getRefreshTokenExpiryDate = () => {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
};

const generateAndStoreEmailOtp = async (email) => {
  const otp = generateOtp();
  const otpHash = hashSensitiveValue(otp);

  await setValue(getEmailOtpKey(email), otpHash, EMAIL_OTP_TTL_SECONDS);
  await setValue(getEmailOtpCooldownKey(email), "1", EMAIL_OTP_COOLDOWN_SECONDS);
  await deleteKey(getEmailOtpAttemptKey(email));

  await sendVerificationOtpEmail({
    to: email,
    otp,
    expiresMinutes: Math.ceil(EMAIL_OTP_TTL_SECONDS / 60),
  });

  return otp;
};

const buildAuthToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    }
  );
};

const issueAccessAndRefreshTokens = async (user) => {
  const accessToken = buildAuthToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = getRefreshTokenExpiryDate();
  await user.save();

  return { accessToken, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      isEmailVerified: false,
    });

    const otp = await generateAndStoreEmailOtp(email);

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Verify your email OTP to activate login.",
      data: {
        user: user.toJSON(),
        ...(process.env.NODE_ENV === "development" && { otp }),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found for this email.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified.",
      });
    }

    const otpHashInRedis = await getValue(getEmailOtpKey(email));
    if (!otpHashInRedis) {
      return res.status(400).json({
        success: false,
        message: "OTP is expired or missing. Please request a new OTP.",
      });
    }

    const attemptCount = await incrementValue(
      getEmailOtpAttemptKey(email),
      EMAIL_OTP_TTL_SECONDS
    );
    if (attemptCount && attemptCount > EMAIL_OTP_ATTEMPT_LIMIT) {
      await deleteKey(getEmailOtpKey(email));
      return res.status(429).json({
        success: false,
        message: "Too many invalid attempts. Please request a new OTP.",
      });
    }

    const incomingOtpHash = hashSensitiveValue(otp);
    if (incomingOtpHash !== otpHashInRedis) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    await Promise.all([
      deleteKey(getEmailOtpKey(email)),
      deleteKey(getEmailOtpAttemptKey(email)),
      deleteKey(getEmailOtpCooldownKey(email)),
    ]);

    const { accessToken, refreshToken } = await issueAccessAndRefreshTokens(user);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: {
        accessToken,
        refreshToken,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const resendEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found for this email.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const cooldownExists = await getValue(getEmailOtpCooldownKey(email));
    if (cooldownExists) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting a new OTP.",
      });
    }

    const otp = await generateAndStoreEmailOtp(email);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
      data: {
        ...(process.env.NODE_ENV === "development" && { otp }),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Email is not verified. Please verify OTP first.",
      });
    }

    user.lastLoginAt = new Date();
    const { accessToken, refreshToken } = await issueAccessAndRefreshTokens(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken,
        refreshToken,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.body.refreshToken;
    const incomingHash = hashRefreshToken(incomingRefreshToken);

    const user = await User.findOne({
      refreshTokenHash: incomingHash,
      refreshTokenExpiresAt: { $gt: new Date() },
    }).select("+refreshTokenHash +refreshTokenExpiresAt");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    const tokens = await issueAccessAndRefreshTokens(user);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: tokens,
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.body.refreshToken;
    const incomingHash = hashRefreshToken(incomingRefreshToken);

    await User.updateOne(
      { refreshTokenHash: incomingHash },
      { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } }
    );

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully.",
    data: {
      user: req.user.toJSON(),
    },
  });
};

export const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: updatedUser.toJSON(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!currentPasswordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email exists, a reset token has been sent.",
      });
    }

    const resetToken = generateResetToken();
    const resetTokenHash = hashSensitiveValue(resetToken);
    await setValue(getResetTokenKey(email), resetTokenHash, RESET_TOKEN_TTL_SECONDS);

    await sendPasswordResetEmail({
      to: email,
      resetToken,
      expiresMinutes: Math.ceil(RESET_TOKEN_TTL_SECONDS / 60),
    });

    return res.status(200).json({
      success: true,
      message: "If this email exists, a reset token has been sent.",
      data: {
        ...(process.env.NODE_ENV === "development" && { token: resetToken }),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    const storedTokenHash = await getValue(getResetTokenKey(email));
    if (!storedTokenHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    const incomingTokenHash = hashSensitiveValue(token);
    if (incomingTokenHash !== storedTokenHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();
    await deleteKey(getResetTokenKey(email));

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login again.",
    });
  } catch (error) {
    return next(error);
  }
};
