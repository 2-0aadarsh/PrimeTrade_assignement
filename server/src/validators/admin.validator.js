const buildResult = (errors, value) => ({
  isValid: errors.length === 0,
  errors,
  value,
});

const toTrimmedString = (value) => String(value || "").trim();

export const validateAdminUserIdParam = (payload) => {
  const errors = [];
  const value = {
    userId: toTrimmedString(payload.userId),
  };

  if (!value.userId) {
    errors.push({ field: "userId", message: "User id is required." });
  } else if (!/^[a-f\d]{24}$/i.test(value.userId)) {
    errors.push({ field: "userId", message: "User id must be a valid ObjectId." });
  }

  return buildResult(errors, value);
};

export const validateAdminSetUserStatus = (payload) => {
  const errors = [];
  const value = {
    isActive: payload.isActive,
    reason: toTrimmedString(payload.reason) || null,
  };

  if (typeof value.isActive !== "boolean") {
    errors.push({
      field: "isActive",
      message: "isActive must be a boolean value.",
    });
  }

  if (value.reason && value.reason.length > 250) {
    errors.push({
      field: "reason",
      message: "Reason must not exceed 250 characters.",
    });
  }

  return buildResult(errors, value);
};

export const validateAdminSetUserRole = (payload) => {
  const errors = [];
  const role = toTrimmedString(payload.role);
  const value = { role };

  if (!["user", "admin"].includes(role)) {
    errors.push({
      field: "role",
      message: "Role must be either user or admin.",
    });
  }

  return buildResult(errors, value);
};
