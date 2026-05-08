import { useCallback, useEffect, useRef, useState } from "react";
import { AuthContext } from "./authContext";

const STORAGE_KEYS = {
  token: "token",
  user: "user",
  remember: "rememberMe",
};

const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.remember);
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.user);
  sessionStorage.removeItem(STORAGE_KEYS.remember);
};

const readStoredAuth = () => {
  const sources = [
    { storage: localStorage, remember: true },
    { storage: sessionStorage, remember: false },
  ];

  for (const { storage, remember } of sources) {
    const token = storage.getItem(STORAGE_KEYS.token);
    const userData = storage.getItem(STORAGE_KEYS.user);

    if (!token || !userData) continue;

    const payload = decodeJwt(token);
    if (payload?.exp && Date.now() >= payload.exp * 1000) {
      clearStoredAuth();
      continue;
    }

    return { user: JSON.parse(userData), token, remember };
  }

  return { user: null, token: null, remember: true };
};

export default function AuthProvider({ children }) {
  const initialAuth = readStoredAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);
  const [rememberMe, setRememberMe] = useState(initialAuth.remember);
  const logoutTimerRef = useRef(null);

  const clearScheduledLogout = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearScheduledLogout();
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setRememberMe(true);
  }, [clearScheduledLogout]);

  const persistAuth = useCallback((nextUser, nextToken, nextRememberMe) => {
    clearScheduledLogout();
    clearStoredAuth();

    const storage = nextRememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.token, nextToken);
    storage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    storage.setItem(STORAGE_KEYS.remember, String(nextRememberMe));
  }, [clearScheduledLogout]);

  const login = useCallback((userData, nextToken, nextRememberMe = true) => {
    persistAuth(userData, nextToken, nextRememberMe);
    setUser(userData);
    setToken(nextToken);
    setRememberMe(nextRememberMe);
  }, [persistAuth]);

  useEffect(() => {
    if (!token) return;

    const payload = decodeJwt(token);
    if (!payload?.exp) return;

    const expiresInMs = payload.exp * 1000 - Date.now();
    if (expiresInMs <= 0) {
      queueMicrotask(() => logout());
      return;
    }

    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, expiresInMs);

    return clearScheduledLogout;
  }, [token, logout, clearScheduledLogout]);

  useEffect(() => {
    if (!token || !user) return;

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.token, token);
    storage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    storage.setItem(STORAGE_KEYS.remember, String(rememberMe));
  }, [token, user, rememberMe]);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, rememberMe }}>
      {children}
    </AuthContext.Provider>
  );
}
