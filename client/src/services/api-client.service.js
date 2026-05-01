import axios from "axios";

import { tokenStorage } from "../utils/token-storage.util";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshInFlightPromise = null;
let authFailureHandler = null;

export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

const refreshAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(
    `${BASE_URL}/auth/refresh-token`,
    { refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const nextAccessToken = response?.data?.data?.accessToken;
  const nextRefreshToken = response?.data?.data?.refreshToken;

  if (!nextAccessToken || !nextRefreshToken) {
    throw new Error("Refresh endpoint did not return tokens");
  }

  tokenStorage.setSession({
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  });

  return nextAccessToken;
};

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error?.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = String(originalRequest.url || "");
    const skipRefresh =
      requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh-token");

    if (skipRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshInFlightPromise) {
        refreshInFlightPromise = refreshAccessToken().finally(() => {
          refreshInFlightPromise = null;
        });
      }

      const nextAccessToken = await refreshInFlightPromise;
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      tokenStorage.clearSession();
      if (authFailureHandler) authFailureHandler();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
