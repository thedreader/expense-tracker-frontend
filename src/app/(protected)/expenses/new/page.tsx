"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense, reccuringCharge } from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/app/EmptyState";
import { NewExpenseForm } from "@/components/app/NewExpenseForm";
import type { Category } from "@/types";

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCategories();
        if (active) {
          setCategories(data);
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

  const handleCreate = async (formData: FormData) => {
    const isRecurring = formData.get("isRecurring") === "on";

    const payload = {
      name: (formData.get("name") as string) || "",
      amount: Number(formData.get("amount") || 0),
      category: (formData.get("category") as string) || "",
      date: (formData.get("date") as string) || "",
      description: (formData.get("description") as string) || "",
    };

    try {
      if (isRecurring) {
        const endDateValue = formData.get("endDate");
        const endDate =
          typeof endDateValue === "string" && endDateValue.trim().length > 0
            ? endDateValue
            : undefined;

        await reccuringCharge({
          ...payload,
          frequency: (formData.get("frequency") as string) || "",
          interval: Number(formData.get("interval") || 1),
          startDate: (formData.get("startDate") as string) || "",
          endDate,
        });
      } else {
        await createExpense(payload);
      }
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
          <NewExpenseForm action={handleCreate} today={today} categories={categories} />
        )}
      </Card>
    </div>
  );
}
