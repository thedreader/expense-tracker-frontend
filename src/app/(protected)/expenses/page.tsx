"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  deleteExpense,
  getExpenses,
  getExpensesByCategory,
} from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { PlusIcon } from "@/components/icons";
import type { Category, Expense } from "@/types";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "INR",
  });
}

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

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCategory = searchParams.get("category") || "All";
  const query = searchParams.get("q") || "";
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";
  const requestedPage = Number(searchParams.get("page") || "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(
    Boolean(startDateParam || endDateParam) // auto-open if dates are in URL
  );

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoriesData = await getCategories();

        // Build date filter params to pass to API
        const dateParams: { startDate?: string; endDate?: string } = {};
        if (startDateParam) dateParams.startDate = startDateParam;
        if (endDateParam) dateParams.endDate = endDateParam;

        const expensesData =
          selectedCategory === "All"
            ? await getExpenses(dateParams)
            : await getExpensesByCategory(selectedCategory, dateParams);

        if (!active) return;
        setCategories(categoriesData);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
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
    return () => { active = false; };
  }, [selectedCategory, startDateParam, endDateParam]);

  const pageSize = 20;
  const filtered = useMemo(
    () =>
      query
        ? expenses.filter((expense) =>
            expense.name.toLowerCase().includes(query.toLowerCase())
          )
        : expenses,
    [expenses, query]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const paginatedExpenses = filtered.slice(pageStart, pageStart + pageSize);

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (startDateParam) params.set("startDate", startDateParam);
    if (endDateParam) params.set("endDate", endDateParam);
    if (page > 1) params.set("page", String(page));
    const queryString = params.toString();
    return queryString ? `/expenses?${queryString}` : "/expenses";
  };

  const handleFilterSubmit = (formData: FormData) => {
    const nextQ = String(formData.get("q") || "").trim();
    const nextCategory = String(formData.get("category") || "All");
    const nextStartDate = String(formData.get("startDate") || "").trim();
    const nextEndDate = String(formData.get("endDate") || "").trim();

    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextCategory && nextCategory !== "All") params.set("category", nextCategory);
    if (nextStartDate) params.set("startDate", nextStartDate);
    if (nextEndDate) params.set("endDate", nextEndDate);

    router.push(params.toString() ? `/expenses?${params.toString()}` : "/expenses");
  };

  const handleClearDates = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    router.push(params.toString() ? `/expenses?${params.toString()}` : "/expenses");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((expense) => expense._id !== id));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const hasActiveDateFilter = Boolean(startDateParam || endDateParam);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Expenses</p>
          <h1 className="text-3xl font-semibold">All expenses</h1>
        </div>
        <Link href="/expenses/new">
          <Button>
            <PlusIcon />
            Add expense
          </Button>
        </Link>
      </div>

      <Card className="space-y-4">
        <form
          className="space-y-4"
          action={handleFilterSubmit}
        >
          {/* Search + filter toggle row */}
          <div className="grid gap-3 md:grid-cols-[1fr_auto_0.4fr]">
            <Input
              name="q"
              placeholder="Search by name"
              defaultValue={query}
            />

            {/* Filter icon button */}
            <button
              type="button"
              onClick={() => setShowDateFilter((prev) => !prev)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                hasActiveDateFilter
                  ? "border-[var(--accent-1)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20"
              }`}
              title="Date filters"
              aria-label="Toggle date filters"
            >
              <FilterIcon />
              {/* Dot indicator when date filter is active */}
              {hasActiveDateFilter && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent-1)]" />
              )}
            </button>

            <Select name="category" defaultValue={selectedCategory}>
              <option value="All">All categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Date filter panel — hidden by default, shown on toggle */}
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
              showDateFilter
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0 pointer-events-none"
            }`}
          >
            <div className="grid gap-3 pt-1 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  From
                </label>
                <Input
                  name="startDate"
                  type="date"
                  defaultValue={startDateParam}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wider">
                  To
                </label>
                <Input
                  name="endDate"
                  type="date"
                  defaultValue={endDateParam}
                />
              </div>
            </div>

            {/* Clear dates — only shown when dates are active */}
            {hasActiveDateFilter && (
              <button
                type="button"
                onClick={handleClearDates}
                className="mt-2 text-xs text-white/50 hover:text-white underline underline-offset-2 transition-colors"
              >
                Clear date filters
              </button>
            )}
          </div>

          <div>
            <Button type="submit" variant="outline">
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Try adjusting the filters or add a new expense."
          actionLabel="Add expense"
          actionHref="/expenses/new"
        />
      ) : (
        <div className="grid gap-4">
          {paginatedExpenses.map((expense) => (
            <Card
              key={expense._id}
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            >
              <div className="sm:min-w-[200px]">
                <div className="text-sm font-semibold">{expense.name}</div>
                <div className="text-xs text-white/60">
                  {new Date(expense.date).toLocaleDateString("en-GB")}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{expense.category}</Badge>
                <Badge className="text-white/65">{expense.budgetType}</Badge>
              </div>
              <div className="text-sm font-semibold sm:ml-auto">
                {formatCurrency(expense.amount)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/expenses/${expense._id}`}>
                  <Button variant="outline">Details</Button>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDelete(expense._id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}

          {totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2">
              {safeCurrentPage === 1 ? (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              ) : (
                <Link href={buildPageHref(safeCurrentPage - 1)}>
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="text-sm text-white/60">
                Page {safeCurrentPage} of {totalPages}
              </span>
              {safeCurrentPage === totalPages ? (
                <Button variant="outline" disabled>
                  Next
                </Button>
              ) : (
                <Link href={buildPageHref(safeCurrentPage + 1)}>
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}