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

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategory = searchParams.get("category") || "All";
  const query = searchParams.get("q") || "";
  const requestedPage = Number(searchParams.get("page") || "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoriesData = await getCategories();
        const expensesData =
          selectedCategory === "All"
            ? await getExpenses()
            : await getExpensesByCategory(selectedCategory);
        if (!active) return;
        setCategories(categoriesData);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
      } catch (err) {
        if (active) {
          setError((err as Error).message);
          setExpenses([]);
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
  }, [selectedCategory]);

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
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("q", query);
    if (selectedCategory !== "All") queryParams.set("category", selectedCategory);
    if (page > 1) queryParams.set("page", String(page));
    const queryString = queryParams.toString();
    return queryString ? `/expenses?${queryString}` : "/expenses";
  };

  const handleFilterSubmit = (formData: FormData) => {
    const nextQ = String(formData.get("q") || "").trim();
    const nextCategory = String(formData.get("category") || "All");
    const queryParams = new URLSearchParams();
    if (nextQ) queryParams.set("q", nextQ);
    if (nextCategory && nextCategory !== "All") queryParams.set("category", nextCategory);
    router.push(queryParams.toString() ? `/expenses?${queryParams.toString()}` : "/expenses");
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
          className="grid gap-4 md:grid-cols-[1.1fr_0.4fr]"
          action={handleFilterSubmit}
        >
          <Input name="q" placeholder="Search by name" defaultValue={query} />
          <Select name="category" defaultValue={selectedCategory}>
            <option value="All">All categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2">
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
            <Card key={expense._id} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="sm:min-w-[200px]">
                <div className="text-sm font-semibold">{expense.name}</div>
                <div className="text-xs text-white/60">
                  {new Date(expense.date).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{expense.category}</Badge>
                <Badge className="text-white/65">{expense.budgetType}</Badge>
              </div>
              <div className="text-sm font-semibold sm:ml-auto">{formatCurrency(expense.amount)}</div>
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
