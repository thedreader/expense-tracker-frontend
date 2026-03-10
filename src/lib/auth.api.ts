import { apiClient } from "./apiClient";
import type { ApiMessage, AuthResponse } from "@/types";

export function registerUser(
  name: string,
  email: string,
  password: string
) {
  return apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    skipAuthRefresh: true,
  });
}

export function loginUser(email: string, password: string) {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuthRefresh: true,
  });
}

export function refreshAuth() {
  return apiClient<AuthResponse>("/auth/refresh", {
    method: "POST",
    skipAuthRefresh: true,
  });
}

export function logoutUser() {
  return apiClient<ApiMessage>("/auth/logout", {
    method: "POST",
    skipAuthRefresh: true,
  });
}
