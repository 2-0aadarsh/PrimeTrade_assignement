import apiClient from "./api-client.service";

export const adminService = {
  getSummary() {
    return apiClient.get("/admin/summary");
  },
  getUsers() {
    return apiClient.get("/admin/users");
  },
  setUserStatus(userId, payload) {
    return apiClient.patch(`/admin/users/${userId}/status`, payload);
  },
  setUserRole(userId, payload) {
    return apiClient.patch(`/admin/users/${userId}/role`, payload);
  },
  forceLogout(userId) {
    return apiClient.post(`/admin/users/${userId}/force-logout`);
  },
};
