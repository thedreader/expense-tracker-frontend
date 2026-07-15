import type { BudgetBucketKey, Category, Expense } from "@/types";

export const DEFAULT_BUDGET_TYPE: BudgetBucketKey = "wants";

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export function getTodayInputDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toInputDate(value?: string | null): string {
  if (!value) return "";

  const datePrefix = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) return datePrefix;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function formatExpenseDate(value: string): string {
  const inputDate = toInputDate(value);
  if (!inputDate) return "";

  const [year, month, day] = inputDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getMostRecentBudgetType(
  expenses: Expense[],
): BudgetBucketKey {
  const latest = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];

  return latest?.budgetType ?? DEFAULT_BUDGET_TYPE;
}

export function rankQuickCategories(
  categories: Category[],
  expenses: Expense[],
  limit = 5,
): Category[] {
  // The quick set reflects the user's recent behavior without creating a second category source of truth.
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);
  const usage = new Map<string, { count: number; latest: number }>();

  recentExpenses.forEach((expense, index) => {
    const categoryKey = expense.categoryId || expense.category;
    if (!categoryKey) return;

    const current = usage.get(categoryKey) || { count: 0, latest: 0 };
    usage.set(categoryKey, {
      count: current.count + 1,
      latest: Math.max(current.latest, recentExpenses.length - index),
    });
  });

  return [...categories]
    .sort((a, b) => {
      const aUsage = usage.get(a._id) || usage.get(a.name);
      const bUsage = usage.get(b._id) || usage.get(b.name);
      const countDifference = (bUsage?.count || 0) - (aUsage?.count || 0);
      if (countDifference !== 0) return countDifference;

      const recentDifference = (bUsage?.latest || 0) - (aUsage?.latest || 0);
      if (recentDifference !== 0) return recentDifference;

      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function groupExpensesByDay(expenses: Expense[]) {
  const today = getTodayInputDate();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(
    yesterdayDate.getMonth() + 1,
  ).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;
  const groups = new Map<
    string,
    { key: string; label: string; subtotal: number; expenses: Expense[] }
  >();

  // Use the persisted YYYY-MM-DD portion so midnight dates do not shift groups across time zones.
  expenses.forEach((expense) => {
    const key = toInputDate(expense.date);
    if (!key) return;

    const existing = groups.get(key);
    if (existing) {
      existing.expenses.push(expense);
      existing.subtotal += expense.amount;
      return;
    }

    const label =
      key === today
        ? "Today"
        : key === yesterday
          ? "Yesterday"
          : formatExpenseDate(key);
    groups.set(key, {
      key,
      label,
      subtotal: expense.amount,
      expenses: [expense],
    });
  });

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}
