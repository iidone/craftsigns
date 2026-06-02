"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  patronymic?: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: UserInfo | null;
  isReady: boolean;
  login: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTokenExpired = (token: string) => {
  try {
    const payloadPart = token.split(".")[1];
    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload)) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const readStoredAuth = (): { token: string | null; user: UserInfo | null } => {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const savedToken = localStorage.getItem("auth_token");
  const savedUser = localStorage.getItem("auth_user");

  if (!savedToken || !savedUser) {
    return { token: null, user: null };
  }

  if (isTokenExpired(savedToken)) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    return { token: null, user: null };
  }

  try {
    return { token: savedToken, user: JSON.parse(savedUser) };
  } catch (error) {
    console.error("Failed to parse user data", error);
    return { token: null, user: null };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const storedAuth = readStoredAuth();
      setToken(storedAuth.token);
      setUser(storedAuth.user);
      setIsReady(true);
    });
  }, []);

  const login = (newToken: string, userInfo: UserInfo) => {
    setToken(newToken);
    setUser(userInfo);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(userInfo));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ token, user, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
