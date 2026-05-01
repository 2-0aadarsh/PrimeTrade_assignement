export const ROLES = {
  USER: "user",
  ADMIN: "admin",
};

export const PERMISSIONS = {
  VIEW_ADMIN_PANEL: "view_admin_panel",
  MANAGE_USERS: "manage_users",
  MANAGE_ALL_TASKS: "manage_all_tasks",
};

const ROLE_PERMISSION_MAP = {
  [ROLES.USER]: [],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_ADMIN_PANEL,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_TASKS,
  ],
};

export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSION_MAP[role] || [];
  return permissions.includes(permission);
};
