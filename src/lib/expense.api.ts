import { apiClient } from "./apiClient";
import type { ApiMessage, Expense, RecurringCharge } from "@/types";

type ExpensePayload = {
  name: string;
  amount: number;
  description?: string;
  category: string;
  date: string;
};

type ReccuringChargePayload = ExpensePayload & {
  frequency: string;
  interval: number;
  startDate: string;
  endDate?: string;
};

export function getExpenses(cookieHeader?: string) {
  return apiClient<Expense[]>("/expenses", {
    method: "GET",
    cookieHeader,
  });
}

export function getExpenseById(id: string, cookieHeader?: string) {
  return apiClient<Expense>(`/expenses/${id}`, {
    method: "GET",
    cookieHeader,
  });
}

export function getExpensesByCategory(category: string, cookieHeader?: string) {
  return apiClient<Expense[]>(`/expenses/category/${category}`, {
    method: "GET",
    cookieHeader,
  });
}

export function createExpense(payload: ExpensePayload, cookieHeader?: string) {
  return apiClient<ApiMessage>("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
    cookieHeader,
  });
}

export function reccuringCharge(
  payload: ReccuringChargePayload,
  cookieHeader?: string
) {
  return apiClient<ApiMessage>("/expenses/recurringCharge", {
    method: "POST",
    body: JSON.stringify(payload),
    cookieHeader,
  });
}

export function showRecurringCharges(cookieHeader?: string) {
  return apiClient<RecurringCharge[]>("/expenses/recurringCharges", {
    method: "GET",
    cookieHeader,
  });
}

export function recurringChargeStop(
  recurringChargeId: string,
  cookieHeader?: string
) {
  return apiClient<ApiMessage>(`/expenses/recurringCharges/${recurringChargeId}`, {
    method: "DELETE",
    cookieHeader,
  });
}

export function editRecurringCharge(
  payload: {
    recurringChargeId: string;
    amount?: number;
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
    interval?: number;
    startDate?: string;
    endDate?: string;
    description?: string;
  },
  cookieHeader?: string
) {
  return apiClient<ApiMessage>("/expenses/editRecurringCharge", {
    method: "POST",
    body: JSON.stringify(payload),
    cookieHeader,
  });
}

export function updateExpense(
  id: string,
  payload: Partial<ExpensePayload>,
  cookieHeader?: string
) {
  return apiClient<ApiMessage>(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    cookieHeader,
  });
}

export function deleteExpense(id: string, cookieHeader?: string) {
  return apiClient<ApiMessage>(`/expenses/${id}`, {
    method: "DELETE",
    cookieHeader,
  });
}
