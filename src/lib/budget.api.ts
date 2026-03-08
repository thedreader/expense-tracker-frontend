import { apiClient } from "./apiClient";
import type { ApiMessage, BudgetStatus } from "@/types";

type UpdateBudgetPayload = {
  needs?: number;
  wants?: number;
  investments?: number;
};

export function updateBudget(payload: UpdateBudgetPayload, cookieHeader?: string) {
  return apiClient<ApiMessage>("/budget", {
    method: "PUT",
    body: JSON.stringify(payload),
    cookieHeader,
  });
}

export function getBudgetStatus(cookieHeader?: string) {
  return apiClient<BudgetStatus | { message: string }>("/budget/status", {
    method: "GET",
    cookieHeader,
  });
}
