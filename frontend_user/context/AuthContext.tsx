"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, getApiErrorMessage } from "../lib/api";

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  trustLevel?: string;
  isActive?: boolean;
  createdAt?: string;
};

type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  signup: (payload: SignupPayload) => Promise<string>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const refreshProfile = async () => {
    const response = await api.get("/user/profile");
    const nextUser = response.data.user as AuthUser;
    setUser(nextUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    }
  };

  const signup = async (payload: SignupPayload) => {
    const response = await api.post("/user/signup", {
      fullName: payload.fullName,
      full_name: payload.fullName,
      email: payload.email,
      password: payload.password,
    });

    return response.data.message || "Account created successfully.";
  };

  const login = async (payload: LoginPayload) => {
    const response = await api.post("/user/login", payload);
    const nextToken = response.data.token as string;
    const nextUser = response.data.user as AuthUser;

    setToken(nextToken);
    setUser(nextUser);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);

    if (!storedToken) {
      setIsInitializing(false);
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    refreshProfile()
      .catch((error) => {
        console.error("refreshProfile error:", getApiErrorMessage(error));
        logout();
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isInitializing,
      signup,
      login,
      logout,
      refreshProfile,
    }),
    [user, token, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
