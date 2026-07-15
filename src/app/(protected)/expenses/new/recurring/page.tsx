"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { reccuringCharge } from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import { getTodayInputDate } from "@/lib/expense.utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { RecurringExpenseForm } from "@/components/app/RecurringExpenseForm";
import type { BudgetBucketKey, Category } from "@/types";

function getBudgetType(value: string | null): BudgetBucketKey {
  if (value === "needs" || value === "wants" || value === "investments") {
    return value;
  }
  return "wants";
}

export default function RecurringExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => getTodayInputDate(), []);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (formData: FormData) => {
    const categoryId = String(formData.get("category") || "");
    const category = categories.find((item) => item._id === categoryId);
    const budgetType = getBudgetType(String(formData.get("budgetType") || ""));
    const nameValue = String(formData.get("name") || "").trim();
    const endDateValue = String(formData.get("endDate") || "").trim();

    try {
      await reccuringCharge({
        name: nameValue || category?.name || "",
        amount: Number(formData.get("amount") || 0),
        category: categoryId,
        budgetType,
        frequency: String(formData.get("frequency") || "monthly"),
        interval: Number(formData.get("interval") || 1),
        startDate: String(formData.get("startDate") || ""),
        endDate: endDateValue || undefined,
        description: String(formData.get("description") || ""),
        date: String(formData.get("startDate") || today),
      });
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Expenses</p>
          <h1 className="text-3xl font-semibold">Set up recurring charge</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            This is a separate recurring flow. Quick-add has not created an expense.
          </p>
        </div>
        <Link href="/expenses/new">
          <Button type="button" variant="ghost">Back</Button>
        </Link>
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
            description="Create a category in settings before adding a recurring charge."
            actionLabel="Go to settings"
            actionHref="/settings"
          />
        ) : (
          <RecurringExpenseForm
            action={handleCreate}
            today={today}
            categories={categories}
            initialValues={{
              amount: searchParams.get("amount") || undefined,
              category: searchParams.get("category") || undefined,
              budgetType: getBudgetType(searchParams.get("budgetType")),
              name: searchParams.get("name") || undefined,
              description: searchParams.get("description") || undefined,
              startDate: searchParams.get("startDate") || undefined,
            }}
          />
        )}
      </Card>
    </div>
  );
}
