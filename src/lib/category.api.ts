import { apiClient } from "./apiClient";
import type { ApiMessage, Category } from "@/types";

export function getCategories(cookieHeader?: string) {
  return apiClient<Category[]>("/categories", {
    method: "GET",
    cookieHeader,
  });
}

export function createCategory(
  name: string,
  budgetType: "needs" | "wants" | "investments",
  cookieHeader?: string
) {
  return apiClient<{ message: string; category: Category }>("/categories", {
    method: "POST",
    body: JSON.stringify({ name, budgetType }),
    cookieHeader,
  });
}

export function deleteCategory(id: string, cookieHeader?: string) {
  return apiClient<ApiMessage>(`/categories/${id}`, {
    method: "DELETE",
    cookieHeader,
  });
}
