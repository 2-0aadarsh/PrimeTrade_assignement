import apiClient from "./api-client.service";

export const taskService = {
  list(params) {
    return apiClient.get("/tasks", { params });
  },
  getById(taskId) {
    return apiClient.get(`/tasks/${taskId}`);
  },
  create(payload) {
    return apiClient.post("/tasks", payload);
  },
  update(taskId, payload) {
    return apiClient.patch(`/tasks/${taskId}`, payload);
  },
  remove(taskId) {
    return apiClient.delete(`/tasks/${taskId}`);
  },
};
