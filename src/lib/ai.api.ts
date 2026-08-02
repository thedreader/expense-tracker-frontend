import { apiClient } from "./apiClient";

export type AiExpenseDraft = {
  name: string;
  amount: number;
  category: string | null;
  budgetType: "needs" | "wants" | "investments";
  date: string;
};

type ParseExpenseResponse = {
  drafts: AiExpenseDraft[];
};

export function parseExpenseText(text: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  return apiClient<ParseExpenseResponse>("/ai/parse-expenses", {
    method: "POST",
    body: JSON.stringify({ text }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}
