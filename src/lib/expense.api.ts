import { apiClient } from "./apiClient";
import type { ApiMessage, Expense, RecurringCharge } from "@/types";

type DateFilterParams = {
  startDate?: string;
  endDate?: string;
};

type ExpensePayload = {
  name: string;
  amount: number;
  description?: string;
  category: string;
  date: string;
  budgetType: "needs" | "wants" | "investments";
};

type UpdateExpensePayload = {
  name?: string;
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
  budgetType?: "needs" | "wants" | "investments";
};

type ReccuringChargePayload = ExpensePayload & {
  frequency: string;
  interval: number;
  startDate: string;
  endDate?: string;
};

function buildQueryString(params?: DateFilterParams): string {
  if (!params) return "";
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function getExpenses(params?: DateFilterParams) {
  return apiClient<Expense[]>(`/expenses${buildQueryString(params)}`, {
    method: "GET",
  });
}

export function getExpenseById(id: string) {
  return apiClient<Expense>(`/expenses/${id}`, {
    method: "GET",
  });
}

export function getExpensesByCategory(category: string, params?: DateFilterParams) {
  return apiClient<Expense[]>(`/expenses/category/${category}${buildQueryString(params)}`, {
    method: "GET",
  });
}

export function createExpense(payload: ExpensePayload) {
  return apiClient<ApiMessage>("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reccuringCharge(payload: ReccuringChargePayload) {
  return apiClient<ApiMessage>("/expenses/recurringCharge", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function showRecurringCharges() {
  return apiClient<RecurringCharge[]>("/expenses/recurringCharges", {
    method: "GET",
  });
}

export function recurringChargeStop(recurringChargeId: string) {
  return apiClient<ApiMessage>(`/expenses/recurringCharges/${recurringChargeId}`, {
    method: "DELETE",
  });
}

export function editRecurringCharge(payload: {
  recurringChargeId: string;
  amount?: number;
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  budgetType?: "needs" | "wants" | "investments";
}) {
  return apiClient<ApiMessage>("/expenses/editRecurringCharge", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateExpense(id: string, payload: UpdateExpensePayload) {
  return apiClient<ApiMessage>(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(id: string) {
  return apiClient<ApiMessage>(`/expenses/${id}`, {
    method: "DELETE",
  });
}