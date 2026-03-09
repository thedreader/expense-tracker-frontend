import { apiClient } from "./apiClient";
import type { ApiMessage, User } from "@/types";

export function getCurrentUser() {
  return apiClient<User>("/user", {
    method: "GET",
  });
}

export function updateCurrentUser(
  payload: { name?: string; email?: string; password?: string }
) {
  return apiClient<ApiMessage>("/user", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
