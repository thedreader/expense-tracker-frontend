"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import {
  formatCurrency,
  formatExpenseDate,
  getMostRecentBudgetType,
  getTodayInputDate,
  groupExpensesByDay,
  rankQuickCategories,
} from "@/lib/expense.utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/app/EmptyState";
import { ExpenseQuickAddDialog } from "@/components/app/ExpenseQuickAddDialog";
import { PlusIcon } from "@/components/icons";
import type { BudgetBucketKey, Category, Expense } from "@/types";

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function getBudgetType(value: string): BudgetBucketKey {
  if (value === "needs" || value === "wants" || value === "investments") {
    return value;
  }
  return "wants";
}

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All",
  );
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [showDateFilter, setShowDateFilter] = useState(
    Boolean(searchParams.get("startDate") || searchParams.get("endDate")),
  );
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [hasAnyExpenses, setHasAnyExpenses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => getTodayInputDate(), []);

  const dateParams = useMemo(() => {
    const params: { startDate?: string; endDate?: string } = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [startDate, endDate]);
  const hasDateFilter = Boolean(startDate || endDate);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const allExpensesPromise =
          hasDateFilter ? getExpenses() : Promise.resolve(null);
        const [categoriesData, expensesData, allExpensesData] = await Promise.all([
          getCategories(),
          getExpenses(dateParams),
          allExpensesPromise,
        ]);
        if (!active) return;
        setCategories(categoriesData);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
        const allExpenses = allExpensesData || expensesData;
        setHasAnyExpenses(Array.isArray(allExpenses) && allExpenses.length > 0);
      } catch (err) {
        if (active) {
          setError((err as Error).message);
          setExpenses([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [dateParams, hasDateFilter]);

  const quickCategories = useMemo(
    () => rankQuickCategories(categories, expenses),
    [categories, expenses],
  );
  const defaultBudgetType = useMemo(
    () => getMostRecentBudgetType(expenses),
    [expenses],
  );

  const visibleExpenses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesQuery = !normalizedQuery || expense.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === "All" || expense.categoryId === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [expenses, query, selectedCategory]);

  const dayGroups = useMemo(
    () => groupExpensesByDay(visibleExpenses),
    [visibleExpenses],
  );
  const visibleTotal = useMemo(
    () => visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [visibleExpenses],
  );

  const buildUrl = (overrides: {
    query?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const params = new URLSearchParams();
    const nextQuery = overrides.query ?? query;
    const nextCategory = overrides.category ?? selectedCategory;
    const nextStartDate = overrides.startDate ?? startDate;
    const nextEndDate = overrides.endDate ?? endDate;

    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory !== "All") params.set("category", nextCategory);
    if (nextStartDate) params.set("startDate", nextStartDate);
    if (nextEndDate) params.set("endDate", nextEndDate);

    const queryString = params.toString();
    return queryString ? `/expenses?${queryString}` : "/expenses";
  };


  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    router.push(buildUrl({ category }));
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    router.push(buildUrl({ startDate: "", endDate: "" }));
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    setExpenses((current) => {
      const next = current.filter((expense) => expense._id !== id);
      if (!hasDateFilter) setHasAnyExpenses(next.length > 0);
      return next;
    });
  };

  const handleSave = async (formData: FormData) => {
    const categoryId = String(formData.get("category") || "");
    const name = String(formData.get("name") || "").trim();
    const amount = Number(formData.get("amount") || 0);
    const budgetType = getBudgetType(String(formData.get("budgetType") || defaultBudgetType));
    const date = String(formData.get("date") || "");
    const description = String(formData.get("description") || "");

    const payload = {
      name,
      amount,
      category: categoryId,
      budgetType,
      date,
      description,
    };

    if (editingExpense) {
      await updateExpense(editingExpense._id, payload);
    } else {
      await createExpense(payload);
    }

    const refreshedExpenses = await getExpenses(dateParams);
    setExpenses(refreshedExpenses);
    if (!hasDateFilter) setHasAnyExpenses(refreshedExpenses.length > 0);

    setError(null);
  };

  const openNewExpense = () => {
    setError(null);
    setEditingExpense(null);
    setIsQuickAddOpen(true);
  };

  const openEditExpense = (expense: Expense) => {
    setError(null);
    setEditingExpense(expense);
    setIsQuickAddOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
      </div>
    );
  }

  const hasNoExpenses = !hasAnyExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Expenses</p>
          <h1 className="text-3xl font-semibold">All expenses</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-[var(--accent-1)]">
            {formatCurrency(visibleTotal)}
          </div>
          <div className="text-xs text-white/50">
            {visibleExpenses.length} this month
          </div>
        </div>
      </div>

      <Card className="space-y-5">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              className="min-w-0 flex-1"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by expense name"
              aria-label="Search expenses by name"
            />
            <button
              type="button"
              onClick={() => setShowDateFilter((current) => !current)}
              className={`relative flex h-11 px-3 shrink-0 items-center justify-center gap-2 rounded-xl border transition-colors ${
                startDate || endDate
                  ? "border-[var(--accent-1)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"
              }`}
              title="Date filters"
              aria-label="Toggle date filters"
            >
              <FilterIcon />
              {/* <span className="text-sm font-medium">Dates</span> */}
              <span className="hidden text-sm font-medium sm:inline">Dates</span>
              {startDate || endDate ? (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--accent-1)]" />
              ) : null}
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">
              Categories
            </div>
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-1 pr-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {[{ _id: "All", name: "All" } as Category, ...categories].map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    aria-pressed={selectedCategory === category._id}
                    onClick={() => handleCategoryChange(category._id)}
                    className={`min-h-11 shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedCategory === category._id
                        ? "border-[var(--accent-1)] bg-[var(--accent-1)] text-[#0D0D0D]"
                        : "border-white/15 bg-white/5 text-white/65 hover:border-white/35 hover:text-white"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-1 right-0 top-0 w-12 bg-gradient-to-l from-[var(--panel)] to-transparent" />
            </div>
          </div>

          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
              showDateFilter ? "max-h-40 opacity-100" : "pointer-events-none max-h-0 opacity-0"
            }`}
          >
            <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="startDate" className="text-xs uppercase tracking-wider text-white/50">
                  From
                </label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="endDate" className="text-xs uppercase tracking-wider text-white/50">
                  To
                </label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>
            {startDate || endDate ? (
              <button
                type="button"
                onClick={handleClearDates}
                className="mt-2 inline-flex min-h-11 items-center text-sm text-white/50 underline underline-offset-2 hover:text-white"
              >
                Clear date filters
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      ) : null}

      {/* <Card className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">
            Current view
          </div>
          <div className="mt-1 text-2xl font-semibold">{formatCurrency(visibleTotal)}</div>
        </div>
        <div className="text-sm text-white/60">
          {visibleExpenses.length} {visibleExpenses.length === 1 ? "transaction" : "transactions"}
        </div>
      </Card> */}

      {hasNoExpenses ? (
        <EmptyState
          title="No expenses logged yet"
          description="Add your first expense to start tracking your spending."
          actionLabel="Add expense"
          actionHref="/expenses/new"
        />
      ) : visibleExpenses.length === 0 ? (
        <EmptyState
          title="No matching expenses"
          description="Try a different search or clear the current filters."
          actionLabel="Clear filters"
          actionHref="/expenses"
        />
      ) : (
        <div className="space-y-7">
          {dayGroups.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg font-semibold">{group.label}</h2>
                <span className="text-sm font-semibold text-white/60">
                  {formatCurrency(group.subtotal)}
                </span>
              </div>

              <div className="space-y-2">
                {group.expenses.map((expense) => {
                  return (
                    <div
                      key={expense._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEditExpense(expense)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openEditExpense(expense);
                        }
                      }}
                      className="cursor-pointer rounded-2xl border border-white/10 bg-[var(--panel)] px-4 py-4 transition-colors hover:border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{expense.name}</div>
                          <div className="mt-1 text-xs text-white/50">
                            {formatExpenseDate(expense.date)} · {expense.category}
                          </div>
                        </div>
                        <div className="whitespace-nowrap text-sm font-semibold">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={openNewExpense}
        aria-label="Add expense"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-1)] text-[#0D0D0D] shadow-[0_10px_30px_rgba(0,255,133,0.25)] transition-transform hover:scale-105 md:bottom-8 md:right-8"
      >
        <PlusIcon />
      </button>

      {isQuickAddOpen ? (
        <ExpenseQuickAddDialog
          today={today}
          categories={categories}
          quickCategories={quickCategories}
          defaultBudgetType={defaultBudgetType}
          expense={editingExpense}
          onClose={() => {
            setIsQuickAddOpen(false);
            setEditingExpense(null);
          }}
          action={handleSave}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}
