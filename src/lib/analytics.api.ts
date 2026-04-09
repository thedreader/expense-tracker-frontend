import { apiClient } from "./apiClient";
import type { AnalyticsResponse } from "@/types";

type AnalyticsParams =
  | { view: "daily"; date: string }
  | { view: "weekly"; date: string }
  | { view: "monthly"; month: number; year: number }
  | { view: "yearly"; year: number };

export function getAnalytics(params: AnalyticsParams) {
  const query = new URLSearchParams();
  query.set("view", params.view);
  if ("date" in params) query.set("date", params.date);
  if ("month" in params) query.set("month", String(params.month));
  if ("year" in params) query.set("year", String(params.year));
  return apiClient<AnalyticsResponse>(`/analytics?${query.toString()}`, {
    method: "GET",
  });
}
