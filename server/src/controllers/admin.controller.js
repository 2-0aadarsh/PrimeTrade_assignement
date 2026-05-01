import User from "../models/user.model.js";
import Task from "../models/task.model.js";

export const getSystemSummary = async (req, res, next) => {
  try {
    const [totalUsers, verifiedUsers, totalTasks, activeTasks, softDeletedTasks] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isEmailVerified: true }),
        Task.countDocuments(),
        Task.countDocuments({ isDeleted: false }),
        Task.countDocuments({ isDeleted: true }),
      ]);

    return res.status(200).json({
      success: true,
      message: "Admin summary fetched successfully.",
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
        },
        tasks: {
          total: totalTasks,
          active: activeTasks,
          softDeleted: softDeletedTasks,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: { users },
    });
  } catch (error) {
    return next(error);
  }
};

export const setUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;

    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot disable or enable your own account.",
      });
    }

    const user = await User.findById(userId).select(
      "+refreshTokenHash +refreshTokenExpiresAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isActive = isActive;
    user.disabledAt = isActive ? null : new Date();
    user.disabledReason = isActive ? null : reason;

    if (!isActive) {
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User account enabled successfully."
        : "User account disabled successfully.",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    return next(error);
  }
};

export const setUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (String(req.user._id) === String(userId) && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    return next(error);
  }
};

export const forceLogoutUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User session invalidated successfully.",
    });
  } catch (error) {
    return next(error);
  }
};
