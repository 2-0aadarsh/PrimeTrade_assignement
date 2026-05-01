const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,64}$/;

const buildResult = (errors, value) => {
  return {
    isValid: errors.length === 0,
    errors,
    value,
  };
};

const normalizeName = (name) => String(name || "").trim();
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizePassword = (password) => String(password || "");

export const validateRegister = (payload) => {
  const errors = [];
  const value = {
    name: normalizeName(payload.name),
    email: normalizeEmail(payload.email),
    password: normalizePassword(payload.password),
  };

  if (!value.name) {
    errors.push({ field: "name", message: "Name is required." });
  } else if (value.name.length < 2 || value.name.length > 50) {
    errors.push({
      field: "name",
      message: "Name must be between 2 and 50 characters.",
    });
  }

  if (!value.email) {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_REGEX.test(value.email)) {
    errors.push({ field: "email", message: "Email format is invalid." });
  }

  if (!value.password) {
    errors.push({ field: "password", message: "Password is required." });
  } else if (!PASSWORD_REGEX.test(value.password)) {
    errors.push({
      field: "password",
      message:
        "Password must include uppercase, lowercase, number, special character and be 8-64 chars.",
    });
  }

  return buildResult(errors, value);
};

export const validateLogin = (payload) => {
  const errors = [];
  const value = {
    email: normalizeEmail(payload.email),
    password: normalizePassword(payload.password),
  };

  if (!value.email) {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_REGEX.test(value.email)) {
    errors.push({ field: "email", message: "Email format is invalid." });
  }

  if (!value.password) {
    errors.push({ field: "password", message: "Password is required." });
  }

  return buildResult(errors, value);
};

export const validateVerifyEmailOtp = (payload) => {
  const errors = [];
  const value = {
    email: normalizeEmail(payload.email),
    otp: String(payload.otp || "").trim(),
  };

  if (!value.email) {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_REGEX.test(value.email)) {
    errors.push({ field: "email", message: "Email format is invalid." });
  }

  if (!value.otp) {
    errors.push({ field: "otp", message: "OTP is required." });
  } else if (!/^\d{6}$/.test(value.otp)) {
    errors.push({ field: "otp", message: "OTP must be a 6-digit code." });
  }

  return buildResult(errors, value);
};

export const validateResendEmailOtp = (payload) => {
  const errors = [];
  const value = {
    email: normalizeEmail(payload.email),
  };

  if (!value.email) {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_REGEX.test(value.email)) {
    errors.push({ field: "email", message: "Email format is invalid." });
  }

  return buildResult(errors, value);
};

export const validateUpdateProfile = (payload) => {
  const errors = [];
  const value = {
    name: normalizeName(payload.name),
  };

  if (!value.name) {
    errors.push({ field: "name", message: "Name is required." });
  } else if (value.name.length < 2 || value.name.length > 50) {
    errors.push({
      field: "name",
      message: "Name must be between 2 and 50 characters.",
    });
  }

  return buildResult(errors, value);
};

export const validateChangePassword = (payload) => {
  const errors = [];
  const value = {
    currentPassword: normalizePassword(payload.currentPassword),
    newPassword: normalizePassword(payload.newPassword),
  };

  if (!value.currentPassword) {
    errors.push({
      field: "currentPassword",
      message: "Current password is required.",
    });
  }

  if (!value.newPassword) {
    errors.push({ field: "newPassword", message: "New password is required." });
  } else if (!PASSWORD_REGEX.test(value.newPassword)) {
    errors.push({
      field: "newPassword",
      message:
        "New password must include uppercase, lowercase, number, special character and be 8-64 chars.",
    });
  }

  if (
    value.currentPassword &&
    value.newPassword &&
    value.currentPassword === value.newPassword
  ) {
    errors.push({
      field: "newPassword",
      message: "New password must be different from current password.",
    });
  }

  return buildResult(errors, value);
};

export const validateForgotPassword = (payload) => {
  return validateResendEmailOtp(payload);
};

export const validateResetPassword = (payload) => {
  const errors = [];
  const value = {
    email: normalizeEmail(payload.email),
    token: String(payload.token || "").trim(),
    newPassword: normalizePassword(payload.newPassword),
  };

  if (!value.email) {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_REGEX.test(value.email)) {
    errors.push({ field: "email", message: "Email format is invalid." });
  }

  if (!value.token) {
    errors.push({ field: "token", message: "Reset token is required." });
  }

  if (!value.newPassword) {
    errors.push({ field: "newPassword", message: "New password is required." });
  } else if (!PASSWORD_REGEX.test(value.newPassword)) {
    errors.push({
      field: "newPassword",
      message:
        "New password must include uppercase, lowercase, number, special character and be 8-64 chars.",
    });
  }

  return buildResult(errors, value);
};

export const validateRefreshToken = (payload) => {
  const errors = [];
  const value = {
    refreshToken: String(payload.refreshToken || "").trim(),
  };

  if (!value.refreshToken) {
    errors.push({ field: "refreshToken", message: "Refresh token is required." });
  }

  return buildResult(errors, value);
};
