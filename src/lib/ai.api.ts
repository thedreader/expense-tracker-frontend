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
  return apiClient<ParseExpenseResponse>("/ai/parse-expenses", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
