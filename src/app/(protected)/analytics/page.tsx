"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { EmptyState } from "@/components/app/EmptyState";
import { ExpenseQuickAddDialog } from "@/components/app/ExpenseQuickAddDialog";
import { AnalyticsPeriodPicker } from "@/components/app/analytics/AnalyticsPeriodPicker";
import { StatCard } from "@/components/app/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAnalytics } from "@/lib/analytics.api";
import { getCategories } from "@/lib/category.api";
import { deleteExpense, updateExpense } from "@/lib/expense.api";
import {
  formatCurrency,
  formatExpenseDate,
  getMonthWeekRange,
  getMonthWeekStart,
  getMostRecentBudgetType,
  rankQuickCategories,
  shiftMonthWeek,
} from "@/lib/expense.utils";
import type {
  AnalyticsCategoryBreakdown,
  AnalyticsChartBar,
  AnalyticsResponse,
  BudgetBucketStatus,
  Category,
  Expense,
} from "@/types";

type ViewMode = "daily" | "weekly" | "monthly" | "yearly";

const ACCENT = {
  needs: "#00FF85",
  wants: "#1E90FF",
  investments: "#FF0099",
} as const;

const SpendingChart = dynamic(
  () => import("@/components/app/analytics/SpendingChart"),
  {
    ssr: false,
    loading: () => (
      <Card>
        <div className="h-[200px] animate-pulse rounded-xl bg-white/5" />
      </Card>
    ),
  },
);

const DOT_COLORS: Record<string, string> = {
  needs: ACCENT.needs,
  wants: ACCENT.wants,
  investments: ACCENT.investments,
};

const CATEGORY_COLORS = [
  "#00FF85",
  "#1E90FF",
  "#FF0099",
  "#facc15",
  "#a78bfa",
  "#34d399",
  "#f97316",
  "#ec4899",
];

const EMPTY_ANALYTICS: AnalyticsResponse = {
  period: {
    view: "monthly",
    label: "No period available",
    sub: "",
    start: "",
    end: "",
  },
  summary: {
    total: 0,
    needs: 0,
    wants: 0,
    investments: 0,
    transactionCount: 0,
  },
  chartData: [],
  categoryBreakdown: [],
  expenses: [],
};

function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getProgressColor(pct: number): string {
  if (pct > 90) return "bg-red-500";
  if (pct >= 70) return "bg-yellow-400";
  return "bg-green-500";
}

function getProgressBarColor(pct: number): string {
  if (pct > 90) return "#ef4444";
  if (pct >= 70) return "#facc15";
  return "#22c55e";
}

function normalizeBucketStatus(
  value: unknown,
): BudgetBucketStatus | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const bucket = value as Partial<BudgetBucketStatus>;
  if (
    typeof bucket.budget !== "number" ||
    typeof bucket.spent !== "number" ||
    typeof bucket.remaining !== "number" ||
    typeof bucket.percentageUsed !== "number"
  ) {
    return null;
  }

  return {
    budget: bucket.budget,
    spent: bucket.spent,
    remaining: bucket.remaining,
    percentageUsed: bucket.percentageUsed,
  };
}

function normalizeAnalyticsResponse(payload: unknown): AnalyticsResponse {
  if (!payload || typeof payload !== "object") {
    return EMPTY_ANALYTICS;
  }

  const raw = payload as Partial<AnalyticsResponse>;

  const chartData = Array.isArray(raw.chartData)
    ? raw.chartData.filter(
        (item): item is AnalyticsChartBar =>
          Boolean(item) &&
          typeof item.label === "string" &&
          typeof item.total === "number" &&
          typeof item.needs === "number" &&
          typeof item.wants === "number" &&
          typeof item.investments === "number",
      )
    : [];

  const categoryBreakdown = Array.isArray(raw.categoryBreakdown)
    ? raw.categoryBreakdown.filter(
        (item): item is AnalyticsCategoryBreakdown =>
          Boolean(item) &&
          typeof item.category === "string" &&
          typeof item.total === "number" &&
          typeof item.percentage === "number",
      )
    : [];

  const expenses = Array.isArray(raw.expenses)
    ? raw.expenses.filter(
        (item): item is Expense =>
          Boolean(item) &&
          typeof item._id === "string" &&
          typeof item.name === "string" &&
          typeof item.amount === "number" &&
          typeof item.category === "string" &&
          typeof item.budgetType === "string" &&
          typeof item.date === "string",
      )
    : [];

  return {
    period:
      raw.period &&
      typeof raw.period.label === "string" &&
      typeof raw.period.sub === "string" &&
      typeof raw.period.start === "string" &&
      typeof raw.period.end === "string"
        ? {
            view:
              raw.period.view === "daily" ||
              raw.period.view === "weekly" ||
              raw.period.view === "monthly" ||
              raw.period.view === "yearly"
                ? raw.period.view
                : "monthly",
            label: raw.period.label,
            sub: raw.period.sub,
            start: raw.period.start,
            end: raw.period.end,
          }
        : EMPTY_ANALYTICS.period,
    summary:
      raw.summary &&
      typeof raw.summary.total === "number" &&
      typeof raw.summary.needs === "number" &&
      typeof raw.summary.wants === "number" &&
      typeof raw.summary.investments === "number" &&
      typeof raw.summary.transactionCount === "number"
        ? raw.summary
        : EMPTY_ANALYTICS.summary,
    chartData,
    categoryBreakdown,
    expenses,
    budgetStatus: raw.budgetStatus
      ? {
          needs: normalizeBucketStatus(raw.budgetStatus.needs),
          wants: normalizeBucketStatus(raw.budgetStatus.wants),
          investments: normalizeBucketStatus(raw.budgetStatus.investments),
        }
      : undefined,
  };
}

function NeedsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WantsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 7.65l.77.76L12 20.64l7.65-7.65.77-.76a5.4 5.4 0 0 0 0-7.65Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InvestmentsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 12h-4l-3 9L9 3l-3 9H2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TotalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AnalyticsPage() {
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<AnalyticsResponse>(EMPTY_ANALYTICS);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (view === "daily") nextDate.setDate(nextDate.getDate() - 1);
      if (view === "weekly") return shiftMonthWeek(prev, -1);
      if (view === "monthly") nextDate.setMonth(nextDate.getMonth() - 1);
      if (view === "yearly") nextDate.setFullYear(nextDate.getFullYear() - 1);
      return nextDate;
    });
  }, [view]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (view === "daily") nextDate.setDate(nextDate.getDate() + 1);
      if (view === "weekly") return shiftMonthWeek(prev, 1);
      if (view === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      if (view === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
      return nextDate;
    });
  }, [view]);

  const isCurrentPeriod = useMemo(() => {
    const now = new Date();
    if (view === "daily") {
      return currentDate.toDateString() === now.toDateString();
    }

    if (view === "weekly") {
      return getMonthWeekRange(currentDate).start.getTime() === getMonthWeekRange(now).start.getTime();
    }

    if (view === "monthly") {
      return (
        currentDate.getMonth() === now.getMonth() &&
        currentDate.getFullYear() === now.getFullYear()
      );
    }

    return currentDate.getFullYear() === now.getFullYear();
  }, [currentDate, view]);

  const buildParams = useCallback(() => {
    if (view === "daily") {
      return {
        view: "daily" as const,
        date: formatDateParam(currentDate),
      };
    }

    if (view === "weekly") {
      return {
        view: "weekly" as const,
        date: formatDateParam(getMonthWeekRange(currentDate).start),
      };
    }

    if (view === "monthly") {
      return {
        view: "monthly" as const,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      };
    }

    return {
      view: "yearly" as const,
      year: currentDate.getFullYear(),
    };
  }, [currentDate, view]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [result, categoriesData] = await Promise.all([
          getAnalytics(buildParams()),
          getCategories(),
        ]);
        if (active) {
          setData(normalizeAnalyticsResponse(result));
          setUserCategories(categoriesData);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load analytics right now.",
          );
          setData(EMPTY_ANALYTICS);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [buildParams]);

  const handleViewChange = (nextView: ViewMode) => {
    setView(nextView);
    const nextDate = new Date();
    setCurrentDate(nextView === "weekly" ? getMonthWeekStart(nextDate.getFullYear(), nextDate.getMonth(), getMonthWeekRange(nextDate).week) : nextDate);
  };

  const summary = data.summary;
  const period = data.period;
  const chartData = data.chartData;
  const categories = data.categoryBreakdown;
  const expenses = data.expenses;
  const budgetStatus = data.budgetStatus;
  const quickCategories = useMemo(
    () => rankQuickCategories(userCategories, expenses),
    [userCategories, expenses],
  );
  const defaultBudgetType = useMemo(
    () => getMostRecentBudgetType(expenses),
    [expenses],
  );

  const refreshAnalytics = useCallback(async () => {
    const result = await getAnalytics(buildParams());
    setData(normalizeAnalyticsResponse(result));
  }, [buildParams]);

  const handleExpenseSave = async (formData: FormData) => {
    if (!selectedExpense) return;

    await updateExpense(selectedExpense._id, {
      name: String(formData.get("name") || "").trim(),
      amount: Number(formData.get("amount") || 0),
      category: String(formData.get("category") || ""),
      budgetType: String(formData.get("budgetType") || "wants") as
        | "needs"
        | "wants"
        | "investments",
      date: String(formData.get("date") || ""),
      description: String(formData.get("description") || ""),
    });
    await refreshAnalytics();
  };

  const handleExpenseDelete = async (id: string) => {
    await deleteExpense(id);
    await refreshAnalytics();
  };

  const needsPct = summary.total
    ? ((summary.needs / summary.total) * 100).toFixed(1)
    : "0";
  const wantsPct = summary.total
    ? ((summary.wants / summary.total) * 100).toFixed(1)
    : "0";
  const investmentsPct = summary.total
    ? ((summary.investments / summary.total) * 100).toFixed(1)
    : "0";

  const views: ViewMode[] = ["daily", "weekly", "monthly", "yearly"];
  const hasAnyAnalytics =
    summary.total > 0 ||
    chartData.length > 0 ||
    categories.length > 0 ||
    expenses.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Analytics</p>
        <h1 className="text-3xl font-semibold">Spending Insights</h1>
      </div>

      <div className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 sm:inline-flex sm:w-auto sm:gap-0.5 sm:rounded-full">
        {views.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleViewChange(item)}
            className={`min-h-11 w-full rounded-full px-3 py-2 text-sm font-medium capitalize transition-all duration-200 sm:w-auto sm:px-5 ${
              item === view
                ? "bg-[var(--accent-1)] font-semibold text-[#0D0D0D] shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-3.5 sm:px-5">
        <button
          type="button"
          onClick={goToPrevious}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 sm:px-4"
        >
          <ChevronLeftIcon />
        </button>

        <AnalyticsPeriodPicker
          view={view}
          currentDate={currentDate}
          label={view === "daily" ? currentDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : period.label}
          onChange={setCurrentDate}
        />
        {view !== "daily" ? (
          <div className="hidden max-w-[14rem] truncate text-center text-sm text-white/40 sm:block">
            {period.sub || ""}
          </div>
        ) : null}

        <button
          type="button"
          onClick={goToNext}
          disabled={isCurrentPeriod}
          className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors sm:px-4 ${
            isCurrentPeriod
              ? "cursor-not-allowed text-white/20"
              : "text-white hover:bg-white/10"
          }`}
        >
          <ChevronRightIcon />
        </button>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      )}

      {!loading && !error && !hasAnyAnalytics && (
        <EmptyState
          title="No analytics available"
          description="Add a few expenses to start seeing charts and breakdowns here."
          actionLabel="Add expense"
          actionHref="/expenses/new"
        />
      )}

      {!loading && !error && hasAnyAnalytics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Spent"
              value={formatCurrency(summary.total)}
              helper={`${summary.transactionCount} transactions`}
              accent="#ffffff"
              icon={<TotalIcon />}
            />
            <StatCard
              label="Needs"
              value={formatCurrency(summary.needs)}
              helper={`${needsPct}% of total`}
              accent={ACCENT.needs}
              icon={<NeedsIcon />}
            />
            <StatCard
              label="Wants"
              value={formatCurrency(summary.wants)}
              helper={`${wantsPct}% of total`}
              accent={ACCENT.wants}
              icon={<WantsIcon />}
            />
            <StatCard
              label="Investments"
              value={formatCurrency(summary.investments)}
              helper={`${investmentsPct}% of total`}
              accent={ACCENT.investments}
              icon={<InvestmentsIcon />}
            />
          </div>

          {budgetStatus && (
            <div className="grid gap-4 lg:grid-cols-3">
              {(
                [
                  { key: "needs", label: "Needs" },
                  { key: "wants", label: "Wants" },
                  { key: "investments", label: "Investments" },
                ] as const
              ).map((bucket) => {
                const status = budgetStatus[bucket.key];
                if (!status) return null;

                const pct = Math.min(status.percentageUsed, 100);
                return (
                  <div
                    key={bucket.key}
                    className="rounded-2xl border border-white/10 bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-sm uppercase tracking-[0.1em] text-white/40">
                        {bucket.label}
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: getProgressBarColor(status.percentageUsed),
                        }}
                      >
                        {status.percentageUsed.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mb-2.5 text-xl font-bold">
                      {formatCurrency(status.spent)}
                    </div>

                    <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-white/7">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(status.percentageUsed)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="text-sm text-white/35">
                      {formatCurrency(status.remaining)} remaining of{" "}
                      {formatCurrency(status.budget)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className={
              view === "daily"
                ? "grid gap-5"
                : "grid gap-5 lg:grid-cols-[1.4fr_0.6fr]"
            }
          >
            {view !== "daily" ? (
              <SpendingChart view={view} chartData={chartData} />
            ) : null}

            <Card>
              <h2 className="mb-5 text-sm font-semibold text-white/80">
                Category Mix
              </h2>

              {categories.length > 0 ? (
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={`${category.category}-${index}`}>
                      <div className="mb-1.5 flex flex-wrap justify-between gap-x-2 gap-y-1 text-sm">
                        <span className="min-w-0 break-words text-white/80">{category.category}</span>
                        <span className="shrink-0 text-white/50">
                          {formatCurrency(category.total)} · {category.percentage}%
                        </span>
                      </div>

                      <div className="h-[5px] overflow-hidden rounded-full bg-white/7">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(category.percentage, 100)}%`,
                            backgroundColor:
                              CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[160px] items-center justify-center text-sm text-white/40">
                  No categories for this period
                </div>
              )}
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Transactions</h2>
              <Link
                href="/expenses"
                className="inline-flex min-h-11 items-center text-sm text-white/40 transition-colors hover:text-white"
              >
                View all →
              </Link>
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                title="No expenses found"
                description="No expenses found for this period."
                actionLabel="Add expense"
                actionHref="/expenses/new"
              />
            ) : (
              <div className="space-y-2.5">
                {expenses.slice(0, 10).map((expense) => (
                    <button
                      key={expense._id}
                      type="button"
                      onClick={() => setSelectedExpense(expense)}
                      className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/5 sm:gap-3"
                    >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          DOT_COLORS[expense.budgetType] ?? "#ffffff",
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {expense.name}
                      </div>
                      <div className="mt-0.5 break-words text-sm text-white/40">
                        {formatExpenseDate(expense.date)}{" "}
                        · {expense.category}
                      </div>
                    </div>

                    <Badge className="shrink-0 px-2 py-0.5 text-sm">
                      {expense.budgetType}
                    </Badge>

                    <div className="whitespace-nowrap text-right text-sm font-semibold">
                      {formatCurrency(expense.amount)}
                    </div>
                    </button>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {selectedExpense ? (
        <ExpenseQuickAddDialog
          today={formatDateParam(new Date())}
          categories={userCategories}
          quickCategories={quickCategories}
          defaultBudgetType={defaultBudgetType}
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          action={handleExpenseSave}
          onDelete={handleExpenseDelete}
        />
      ) : null}
    </div>
  );
}
