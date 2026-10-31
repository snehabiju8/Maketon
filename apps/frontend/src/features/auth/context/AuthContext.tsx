import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/auth.api";
import { AuthSession, Customer, LoginPayload, RegisterPayload, User } from "../types";
import { ApiError } from "../../../lib/api-client";

interface AuthContextType {
  user: User | null;
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const session: AuthSession = await authApi.getMe();
      setUser(session.user);
      setCustomer(session.customer ?? null);
    } catch {
      setUser(null);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (payload: LoginPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      await authApi.login(payload);
      await refreshSession();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to login";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await authApi.register(payload);
      setUser(session.user);
      setCustomer(session.customer ?? null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } finally {
      setUser(null);
      setCustomer(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
