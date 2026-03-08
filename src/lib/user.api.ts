import { apiClient } from "./apiClient";
import type { ApiMessage, User } from "@/types";

export function getCurrentUser(cookieHeader?: string) {
  return apiClient<User>("/user", {
    method: "GET",
    cookieHeader,
  });
}

export function updateCurrentUser(
  payload: { name?: string; email?: string; password?: string },
  cookieHeader?: string
) {
  return apiClient<ApiMessage>("/user", {
    method: "PUT",
    body: JSON.stringify(payload),
    cookieHeader,
  });
}
