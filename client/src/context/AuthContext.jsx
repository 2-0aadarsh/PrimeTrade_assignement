import { useCallback, useEffect, useMemo, useState } from "react";

import { hasPermission } from "../constants/permissions";
import { setAuthFailureHandler } from "../services/api-client.service";
import { authService } from "../services/auth.service";
import { tokenStorage } from "../utils/token-storage.util";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenStorage.getUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearAuthState = useCallback(() => {
    tokenStorage.clearSession();
    setUser(null);
  }, []);

  const logoutLocal = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  const refreshUser = useCallback(async () => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) return;
    try {
      const response = await authService.me();
      const next = response?.data?.data?.user;
      if (next) {
        tokenStorage.patchUser(next);
        setUser(next);
      }
    } catch {
      clearAuthState();
    }
  }, [clearAuthState]);

  const bootstrapAuth = useCallback(async () => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      setIsBootstrapping(false);
      return;
    }

    try {
      const response = await authService.me();
      setUser(response?.data?.data?.user || null);
    } catch {
      clearAuthState();
    } finally {
      setIsBootstrapping(false);
    }
  }, [clearAuthState]);

  useEffect(() => {
    setAuthFailureHandler(clearAuthState);
    void bootstrapAuth();
  }, [bootstrapAuth, clearAuthState]);

  const login = useCallback(({ accessToken, refreshToken, user: loginUser }) => {
    tokenStorage.setSession({
      accessToken,
      refreshToken,
      user: loginUser,
    });
    setUser(loginUser);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout({ refreshToken });
      } catch {
        // no-op, local cleanup is primary
      }
    }

    clearAuthState();
  }, [clearAuthState]);

  const value = useMemo(() => {
    const role = user?.role || null;
    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      logout,
      logoutLocal,
      refreshUser,
      hasPermission: (permission) => hasPermission(role, permission),
    };
  }, [user, isBootstrapping, login, logout, logoutLocal, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
