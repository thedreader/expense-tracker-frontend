import { apiClient } from "./apiClient";
import type { ApiMessage, Category } from "@/types";

export function getCategories() {
  return apiClient<Category[]>("/categories", {
    method: "GET",
  });
}

export function createCategory(name: string) {
  return apiClient<{ message: string; category: Category }>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteCategory(id: string) {
  return apiClient<ApiMessage>(`/categories/${id}`, {
    method: "DELETE",
  });
}
