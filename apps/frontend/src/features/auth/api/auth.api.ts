import { apiClient } from "../../../lib/api-client";
import { AuthSession, LoginPayload, RegisterPayload, User } from "../types";

export const authApi = {
  login: async (payload: LoginPayload): Promise<{ user: User }> => {
    return apiClient.post<{ user: User }>("/auth/login", payload);
  },

  register: async (payload: RegisterPayload): Promise<AuthSession> => {
    return apiClient.post<AuthSession>("/auth/register", payload);
  },

  logout: async (): Promise<void> => {
    return apiClient.post<void>("/auth/logout");
  },

  getMe: async (): Promise<AuthSession> => {
    return apiClient.get<AuthSession>("/auth/me");
  },
};
