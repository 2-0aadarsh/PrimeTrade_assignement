import apiClient from "./api-client.service";

export const authService = {
  register(payload) {
    return apiClient.post("/auth/register", payload);
  },
  verifyOtp(payload) {
    return apiClient.post("/auth/verify-email-otp", payload);
  },
  resendOtp(payload) {
    return apiClient.post("/auth/resend-email-otp", payload);
  },
  login(payload) {
    return apiClient.post("/auth/login", payload);
  },
  logout(payload) {
    return apiClient.post("/auth/logout", payload);
  },
  me() {
    return apiClient.get("/auth/me");
  },
  updateProfile(payload) {
    return apiClient.patch("/auth/me", payload);
  },
  changePassword(payload) {
    return apiClient.patch("/auth/change-password", payload);
  },
  forgotPassword(payload) {
    return apiClient.post("/auth/forgot-password", payload);
  },
  resetPassword(payload) {
    return apiClient.post("/auth/reset-password", payload);
  },
};
