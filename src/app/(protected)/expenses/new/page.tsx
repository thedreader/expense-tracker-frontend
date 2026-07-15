"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense, getExpenses } from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import {
  getMostRecentBudgetType,
  getTodayInputDate,
  rankQuickCategories,
} from "@/lib/expense.utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/app/EmptyState";
import { NewExpenseForm } from "@/components/app/NewExpenseForm";
import type { Category, Expense } from "@/types";

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => getTodayInputDate(), []);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoriesData, expensesData] = await Promise.all([
          getCategories(),
          getExpenses(),
        ]);
        if (active) {
          setCategories(categoriesData);
          setExpenses(expensesData);
        }
      } catch (err) {
        if (active) {
          setError((err as Error).message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const quickCategories = useMemo(
    () => rankQuickCategories(categories, expenses),
    [categories, expenses],
  );
  const defaultBudgetType = useMemo(
    () => getMostRecentBudgetType(expenses),
    [expenses],
  );

  const handleCreate = async (formData: FormData) => {
    const categoryId = String(formData.get("category") || "");
    const category = categories.find((item) => item._id === categoryId);
    const name = String(formData.get("name") || "").trim();

    const payload = {
      name: name || category?.name || "",
      amount: Number(formData.get("amount") || 0),
      category: categoryId,
      budgetType: String(formData.get("budgetType") || defaultBudgetType) as
        | "needs"
        | "wants"
        | "investments",
      date: (formData.get("date") as string) || "",
      description: (formData.get("description") as string) || "",
    };

    try {
      await createExpense(payload);
      router.replace("/expenses");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Expenses</p>
        <h1 className="text-3xl font-semibold">Add a new expense</h1>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      ) : null}

      <Card>
        {categories.length === 0 ? (
          <EmptyState
            title="No categories found"
            description="Create a category in settings before adding an expense."
            actionLabel="Go to settings"
            actionHref="/settings"
          />
        ) : (
          <NewExpenseForm
            action={handleCreate}
            today={today}
            categories={categories}
            quickCategories={quickCategories}
            defaultBudgetType={defaultBudgetType}
          />
        )}
      </Card>
    </div>
  );
}
