import { apiClient } from "./apiClient";
import type { ApiMessage, AuthResponse } from "@/types";

export function registerUser(
  name: string,
  email: string,
  password: string,
  cookieHeader?: string
) {
  return apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    cookieHeader,
  });
}

export function loginUser(email: string, password: string, cookieHeader?: string) {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    cookieHeader,
  });
}

export function refreshAuth(cookieHeader?: string) {
  return apiClient<AuthResponse>("/auth/refresh", {
    method: "POST",
    cookieHeader,
  });
}

export function logoutUser(cookieHeader?: string) {
  return apiClient<ApiMessage>("/auth/logout", {
    method: "POST",
    cookieHeader,
  });
}
