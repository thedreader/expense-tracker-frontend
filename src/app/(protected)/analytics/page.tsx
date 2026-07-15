"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/app/EmptyState";
import { StatCard } from "@/components/app/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAnalytics } from "@/lib/analytics.api";
import { formatCurrency, formatExpenseDate } from "@/lib/expense.utils";
import type {
  AnalyticsCategoryBreakdown,
  AnalyticsChartBar,
  AnalyticsResponse,
  BudgetBucketStatus,
  Expense,
} from "@/types";

type ViewMode = "daily" | "weekly" | "monthly" | "yearly";

const ACCENT = {
  needs: "#00FF85",
  wants: "#1E90FF",
  investments: "#FF0099",
} as const;

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

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-white/10 px-4 py-3 shadow-xl"
      style={{ background: "#1a1a1a" }}
    >
      <p className="mb-2 text-xs text-white/60">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.fill }}
          />
          <span className="capitalize text-white/80">{entry.name}</span>
          <span className="ml-auto font-semibold text-white">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [view, setView] = useState<ViewMode>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<AnalyticsResponse>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (view === "daily") nextDate.setDate(nextDate.getDate() - 1);
      if (view === "weekly") nextDate.setDate(nextDate.getDate() - 7);
      if (view === "monthly") nextDate.setMonth(nextDate.getMonth() - 1);
      if (view === "yearly") nextDate.setFullYear(nextDate.getFullYear() - 1);
      return nextDate;
    });
  }, [view]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (view === "daily") nextDate.setDate(nextDate.getDate() + 1);
      if (view === "weekly") nextDate.setDate(nextDate.getDate() + 7);
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
      const getWeekStart = (date: Date) => {
        const copy = new Date(date);
        const day = copy.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        copy.setDate(copy.getDate() + diff);
        copy.setHours(0, 0, 0, 0);
        return copy.getTime();
      };

      return getWeekStart(currentDate) === getWeekStart(now);
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
      const day = currentDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() + diff);
      return {
        view: "weekly" as const,
        date: formatDateParam(monday),
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
        const result = await getAnalytics(buildParams());
        if (active) {
          setData(normalizeAnalyticsResponse(result));
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
    setCurrentDate(new Date());
  };

  const summary = data.summary;
  const period = data.period;
  const chartData = data.chartData;
  const categories = data.categoryBreakdown;
  const expenses = data.expenses;
  const budgetStatus = data.budgetStatus;

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

      <div className="inline-flex gap-0.5 rounded-full border border-white/10 bg-white/5 p-1">
        {views.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleViewChange(item)}
            className={`rounded-full px-5 py-2 text-[13px] font-medium capitalize transition-all duration-200 ${
              item === view
                ? "bg-[var(--accent-1)] font-semibold text-[#0D0D0D] shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="glass flex items-center justify-between rounded-2xl px-5 py-3.5">
        <button
          type="button"
          onClick={goToPrevious}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] text-white transition-colors hover:bg-white/10"
        >
          <ChevronLeftIcon />
          Previous
        </button>

        <div className="text-center">
          <div className="text-[15px] font-semibold">{period.label || "-"}</div>
          <div className="mt-0.5 text-xs text-white/40">{period.sub || ""}</div>
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={isCurrentPeriod}
          className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] transition-colors ${
            isCurrentPeriod
              ? "cursor-not-allowed text-white/20"
              : "text-white hover:bg-white/10"
          }`}
        >
          Next
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            <div className="grid gap-4 md:grid-cols-3">
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
                      <span className="text-[11px] uppercase tracking-[0.1em] text-white/40">
                        {bucket.label}
                      </span>
                      <span
                        className="text-[11px] font-semibold"
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

                    <div className="text-[11px] text-white/35">
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
              <Card>
                <h2 className="mb-5 text-sm font-semibold text-white/80">
                  {view === "weekly" && "Spending by Day"}
                  {view === "monthly" && "Spending by Week"}
                  {view === "yearly" && "Spending by Month"}
                </h2>

                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} barSize={28}>
                        <XAxis
                          dataKey="label"
                          tick={{
                            fill: "rgba(255,255,255,0.4)",
                            fontSize: 11,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        />
                        <Bar
                          dataKey="needs"
                          stackId="a"
                          fill={ACCENT.needs}
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="wants"
                          stackId="a"
                          fill={ACCENT.wants}
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="investments"
                          stackId="a"
                          fill={ACCENT.investments}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 flex gap-4">
                      {(["Needs", "Wants", "Investments"] as const).map(
                        (name, index) => (
                          <div
                            key={name}
                            className="flex items-center gap-1.5 text-[11px] text-white/50"
                          >
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: [
                                  ACCENT.needs,
                                  ACCENT.wants,
                                  ACCENT.investments,
                                ][index],
                              }}
                            />
                            {name}
                          </div>
                        ),
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-sm text-white/40">
                    No chart data for this period
                  </div>
                )}
              </Card>
            ) : null}

            <Card>
              <h2 className="mb-5 text-sm font-semibold text-white/80">
                Category Mix
              </h2>

              {categories.length > 0 ? (
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={`${category.category}-${index}`}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-white/80">{category.category}</span>
                        <span className="text-white/50">
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transactions</h2>
              <Link
                href="/expenses"
                className="text-xs text-white/40 transition-colors hover:text-white"
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
                  <Link
                    key={expense._id}
                    href={`/expenses/${expense._id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          DOT_COLORS[expense.budgetType] ?? "#ffffff",
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">
                        {expense.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-white/40">
                        {formatExpenseDate(expense.date)}{" "}
                        · {expense.category}
                      </div>
                    </div>

                    <Badge className="px-2 py-0.5 text-[10px]">
                      {expense.budgetType}
                    </Badge>

                    <div className="whitespace-nowrap text-right text-sm font-semibold">
                      {formatCurrency(expense.amount)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
