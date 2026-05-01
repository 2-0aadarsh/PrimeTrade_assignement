import Task from "../models/task.model.js";

const OWNER_SUMMARY_FIELDS = "name email";

const getTaskQueryFilter = (query, user) => {
  const filter = { isDeleted: false };

  if (user.role !== "admin") {
    filter.owner = user._id;
  } else if (query.owner) {
    filter.owner = query.owner;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const ownerIdOf = (task) => {
  const o = task?.owner;
  if (o && typeof o === "object" && o._id) return o._id;
  return o;
};

const isTaskAccessible = (task, user) => {
  if (!task) return false;
  if (user.role === "admin") return true;
  return String(ownerIdOf(task)) === String(user._id);
};

export const createTask = async (req, res, next) => {
  try {
    const created = await Task.create({
      ...req.body,
      owner: req.user._id,
    });
    const task = await Task.findById(created._id).populate("owner", OWNER_SUMMARY_FIELDS);

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: { task },
    });
  } catch (error) {
    return next(error);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const { page, limit, sortBy, sortOrder } = query;
    const filter = getTaskQueryFilter(query, req.user);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("owner", OWNER_SUMMARY_FIELDS)
        .sort({ [sortBy]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully.",
      data: {
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, isDeleted: false }).populate(
      "owner",
      OWNER_SUMMARY_FIELDS,
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!isTaskAccessible(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this task.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task fetched successfully.",
      data: { task },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, isDeleted: false });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!isTaskAccessible(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this task.",
      });
    }

    Object.assign(task, req.body);
    await task.save();
    await task.populate("owner", OWNER_SUMMARY_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: { task },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, isDeleted: false });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!isTaskAccessible(task, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this task.",
      });
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task moved to recycle bin for 60 days.",
    });
  } catch (error) {
    return next(error);
  }
};
