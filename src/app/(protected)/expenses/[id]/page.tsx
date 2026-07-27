"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatExpenseDate,
  toInputDate,
} from "@/lib/expense.utils";
import type { Category, Expense } from "@/types";

type UpdateFormState = {
  name: string;
  amount: string;
  category: string;
  budgetType: "needs" | "wants" | "investments" | "";
  date: string;
  description: string;
};

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const expenseId = params.id;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formState, setFormState] = useState<UpdateFormState>({
    name: "",
    amount: "",
    category: "",
    budgetType: "",
    date: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [expenseData, categoriesData] = await Promise.all([
          getExpenseById(expenseId),
          getCategories(),
        ]);
        if (!active) return;
        setExpense(expenseData);
        setCategories(categoriesData);
        setFormState({
          name: expenseData.name,
          amount: String(expenseData.amount),
          category: expenseData.categoryId || "",
          budgetType: expenseData.budgetType,
          date: toInputDate(expenseData.date),
          description: expenseData.description || "",
        });
      } catch {
        if (active) {
          setError("Expense not found.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [expenseId]);

  const onUpdate = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);
    setError(null);

    if (!expense) {
      setError("Expense not found.");
      return;
    }

    const amountValue = Number(formState.amount);
    if (!formState.name.trim() || !formState.category || !formState.budgetType || !formState.date || !Number.isFinite(amountValue) || amountValue < 1) {
      setFieldError("Please provide a valid name, amount, category, budget type and date.");
      return;
    }

    setSaving(true);
    try {
      const payload: Parameters<typeof updateExpense>[1] = {
        name: formState.name.trim(),
        amount: amountValue,
        category: formState.category,
        date: formState.date,
        description: formState.description,
      };

      if (formState.budgetType !== expense.budgetType) {
        payload.budgetType = formState.budgetType;
      }

      await updateExpense(expenseId, payload);
      router.replace("/expenses");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteExpense(expenseId);
      router.replace("/expenses");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
      </div>
    );
  }

  if (!expense) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-6">Expense not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white/60">Expense details</p>
          <h1 className="break-words text-3xl font-semibold">{expense.name}</h1>
        </div>
      </div>

      {(error || fieldError) ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {fieldError || error}
        </div>
      ) : null}

      <Card>
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{expense.category}</Badge>
            <Badge className="text-white/65">{expense.budgetType}</Badge>
            <span className="text-white/60 text-sm">
              {formatExpenseDate(expense.date)}
            </span>
          </div>
          <div className="text-3xl font-semibold">{formatCurrency(expense.amount)}</div>
        </div>

        <form onSubmit={onUpdate} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-white/80">Expense name</label>
              <input
                id="name"
                name="name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm text-white/80">Amount</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="0.01"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, amount: event.target.value }))
                }
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm text-white/80">Category</label>
              <select
                id="category"
                name="category"
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, category: event.target.value }))
                }
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="budgetType" className="text-sm text-white/80">Budget type</label>
              <select
                id="budgetType"
                name="budgetType"
                value={formState.budgetType}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    budgetType: event.target.value as "needs" | "wants" | "investments",
                  }))
                }
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
              >
                <option value="needs">Needs</option>
                <option value="wants">Wants</option>
                <option value="investments">Investments</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm text-white/80">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={formState.date}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, date: event.target.value }))
                }
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm text-white/80">Description</label>
            <textarea
              id="description"
              name="description"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
        <div className="mt-3">
          <Button type="button" variant="ghost" onClick={onDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
