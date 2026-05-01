const ALLOWED_STATUS = ["todo", "in_progress", "done"];
const ALLOWED_PRIORITY = ["low", "medium", "high"];

const buildResult = (errors, value) => {
  return {
    isValid: errors.length === 0,
    errors,
    value,
  };
};

const toOptionalString = (value) =>
  value === undefined || value === null ? undefined : String(value).trim();

export const validateCreateTask = (payload) => {
  const errors = [];
  const value = {
    title: toOptionalString(payload.title),
    description: toOptionalString(payload.description) || "",
    status: toOptionalString(payload.status) || "todo",
    priority: toOptionalString(payload.priority) || "medium",
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
  };

  if (!value.title) {
    errors.push({ field: "title", message: "Title is required." });
  } else if (value.title.length < 3 || value.title.length > 120) {
    errors.push({
      field: "title",
      message: "Title must be between 3 and 120 characters.",
    });
  }

  if (value.description.length > 1000) {
    errors.push({
      field: "description",
      message: "Description cannot exceed 1000 characters.",
    });
  }

  if (!ALLOWED_STATUS.includes(value.status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${ALLOWED_STATUS.join(", ")}.`,
    });
  }

  if (!ALLOWED_PRIORITY.includes(value.priority)) {
    errors.push({
      field: "priority",
      message: `Priority must be one of: ${ALLOWED_PRIORITY.join(", ")}.`,
    });
  }

  if (value.dueDate && Number.isNaN(value.dueDate.getTime())) {
    errors.push({ field: "dueDate", message: "Due date is invalid." });
  }

  return buildResult(errors, value);
};

export const validateUpdateTask = (payload) => {
  const errors = [];
  const value = {};

  if ("title" in payload) {
    const title = toOptionalString(payload.title);
    if (!title) {
      errors.push({ field: "title", message: "Title cannot be empty." });
    } else if (title.length < 3 || title.length > 120) {
      errors.push({
        field: "title",
        message: "Title must be between 3 and 120 characters.",
      });
    } else {
      value.title = title;
    }
  }

  if ("description" in payload) {
    const description = toOptionalString(payload.description) || "";
    if (description.length > 1000) {
      errors.push({
        field: "description",
        message: "Description cannot exceed 1000 characters.",
      });
    } else {
      value.description = description;
    }
  }

  if ("status" in payload) {
    const status = toOptionalString(payload.status);
    if (!ALLOWED_STATUS.includes(status)) {
      errors.push({
        field: "status",
        message: `Status must be one of: ${ALLOWED_STATUS.join(", ")}.`,
      });
    } else {
      value.status = status;
    }
  }

  if ("priority" in payload) {
    const priority = toOptionalString(payload.priority);
    if (!ALLOWED_PRIORITY.includes(priority)) {
      errors.push({
        field: "priority",
        message: `Priority must be one of: ${ALLOWED_PRIORITY.join(", ")}.`,
      });
    } else {
      value.priority = priority;
    }
  }

  if ("dueDate" in payload) {
    if (!payload.dueDate) {
      value.dueDate = null;
    } else {
      const parsedDate = new Date(payload.dueDate);
      if (Number.isNaN(parsedDate.getTime())) {
        errors.push({ field: "dueDate", message: "Due date is invalid." });
      } else {
        value.dueDate = parsedDate;
      }
    }
  }

  if (Object.keys(payload).length === 0) {
    errors.push({ message: "At least one field is required for update." });
  }

  return buildResult(errors, value);
};

export const validateTaskIdParam = (payload) => {
  const errors = [];
  const value = {
    taskId: String(payload.taskId || "").trim(),
  };

  if (!value.taskId) {
    errors.push({ field: "taskId", message: "Task id is required." });
  } else if (!/^[a-f\d]{24}$/i.test(value.taskId)) {
    errors.push({ field: "taskId", message: "Task id must be a valid ObjectId." });
  }

  return buildResult(errors, value);
};

export const validateTaskQuery = (payload) => {
  const errors = [];
  const page = Number(payload.page ?? 1);
  const limit = Number(payload.limit ?? 10);
  const sortBy = toOptionalString(payload.sortBy) || "createdAt";
  const sortOrder = toOptionalString(payload.sortOrder) || "desc";
  const status = toOptionalString(payload.status);
  const priority = toOptionalString(payload.priority);
  const search = toOptionalString(payload.search) || "";

  const value = {
    page,
    limit,
    sortBy,
    sortOrder,
    status,
    priority,
    search,
  };

  if (!Number.isInteger(page) || page < 1) {
    errors.push({ field: "page", message: "Page must be an integer >= 1." });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    errors.push({ field: "limit", message: "Limit must be between 1 and 100." });
  }

  if (!["createdAt", "updatedAt", "title", "dueDate", "priority"].includes(sortBy)) {
    errors.push({
      field: "sortBy",
      message: "sortBy must be one of: createdAt, updatedAt, title, dueDate, priority.",
    });
  }

  if (!["asc", "desc"].includes(sortOrder)) {
    errors.push({ field: "sortOrder", message: "sortOrder must be either asc or desc." });
  }

  if (status && !ALLOWED_STATUS.includes(status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${ALLOWED_STATUS.join(", ")}.`,
    });
  }

  if (priority && !ALLOWED_PRIORITY.includes(priority)) {
    errors.push({
      field: "priority",
      message: `Priority must be one of: ${ALLOWED_PRIORITY.join(", ")}.`,
    });
  }

  return buildResult(errors, value);
};
