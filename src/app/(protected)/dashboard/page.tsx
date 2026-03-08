import Link from "next/link";
import { cookies } from "next/headers";
import { getExpenses } from "@/lib/expense.api";
import { getBudgetStatus } from "@/lib/budget.api";
import { StatCard } from "@/components/app/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { DashboardIcon, ExpensesIcon, PlusIcon } from "@/components/icons";
import type { BudgetBucketKey, BudgetBucketStatus } from "@/types";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

const budgetBuckets: { key: BudgetBucketKey; label: string }[] = [
  { key: "needs", label: "Needs" },
  { key: "wants", label: "Wants" },
  { key: "investments", label: "Investments" },
];

function getProgressColor(percentageUsed: number) {
  if (percentageUsed > 90) return "bg-red-500";
  if (percentageUsed >= 70) return "bg-yellow-400";
  return "bg-green-500";
}

export default async function DashboardPage() {
  const cookieHeader = (await cookies()).toString();
  let expenses = [] as Awaited<ReturnType<typeof getExpenses>>;
  let budgetStatus: Awaited<ReturnType<typeof getBudgetStatus>> | null = null;
  let error: string | null = null;

  try {
    const [expensesData, budgetData] = await Promise.all([
      getExpenses(cookieHeader),
      getBudgetStatus(cookieHeader),
    ]);
    expenses = expensesData;
    budgetStatus = budgetData;
  } catch (err) {
    error = (err as Error).message;
  }

  const now = new Date();
  const monthlyExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const totalMonthly = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const dailyAverage = monthlyExpenses.length ? totalMonthly / Math.max(1, now.getDate()) : 0;

  const categoryTotals = monthlyExpenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const recent = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
  const activeBudgetStatus = budgetStatus && "month" in budgetStatus ? budgetStatus : null;
  const hasAnyBudgetBucket = Boolean(
    activeBudgetStatus?.needs || activeBudgetStatus?.wants || activeBudgetStatus?.investments
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Dashboard</p>
          <h1 className="text-3xl font-semibold">Monthly Overview</h1>
        </div>
        <Link href="/expenses/new">
          <Button>
            <PlusIcon />
            Add expense
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total this month"
          value={formatCurrency(totalMonthly)}
          helper="Based on logged expenses"
          accent="#00FF85"
          icon={<DashboardIcon />}
        />
        <StatCard
          label="Average per day"
          value={formatCurrency(dailyAverage)}
          helper={`Across ${now.getDate()} days`}
          accent="#1E90FF"
          icon={<ExpensesIcon />}
        />
        <StatCard
          label="Top category"
          value={topCategory ? topCategory[0] : "No data"}
          helper={topCategory ? formatCurrency(topCategory[1]) : "Add expenses"}
          accent="#FF0099"
          icon={<PlusIcon />}
        />
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Budget status</h2>
        {hasAnyBudgetBucket ? (
          <div className="grid gap-4 md:grid-cols-3">
            {budgetBuckets.map((bucket) => {
              const bucketStatus = activeBudgetStatus?.[bucket.key];
              return (
                <div key={bucket.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold">{bucket.label}</div>
                  {bucketStatus ? (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-white/60">Budget: {formatCurrency(bucketStatus.budget)}</div>
                      <div className="text-xs text-white/60">Spent: {formatCurrency(bucketStatus.spent)}</div>
                      <div className="text-xs text-white/60">Remaining: {formatCurrency(bucketStatus.remaining)}</div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(bucketStatus.percentageUsed)}`}
                          style={{ width: `${Math.min(bucketStatus.percentageUsed, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/60">{bucketStatus.percentageUsed}% used</div>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-white/50">Set budget</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/70 mb-4">
              You have not set budget buckets yet.
            </p>
            <Link href="/settings">
              <Button>Set budgets in settings</Button>
            </Link>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent expenses</h2>
            <Link href="/expenses" className="text-sm text-white/70 hover:text-white">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              description="Log your first expense to see insights here."
              actionLabel="Add expense"
              actionHref="/expenses/new"
            />
          ) : (
            <div className="space-y-3">
              {recent.map((expense) => (
                <div
                  key={expense._id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold">{expense.name}</div>
                    <div className="text-xs text-white/60">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{expense.category}</Badge>
                    <Badge className="text-white/65">{expense.budgetType}</Badge>
                  </div>
                  <div className="text-sm font-semibold sm:ml-auto">{formatCurrency(expense.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Category mix</h2>
          {Object.keys(categoryTotals).length === 0 ? (
            <EmptyState
              title="No category mix yet"
              description="Add expenses to see how spending is distributed."
              actionLabel="Add expense"
              actionHref="/expenses/new"
            />
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([category, total]) => {
                  const percent = totalMonthly ? (total / totalMonthly) * 100 : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{category}</span>
                        <span className="text-white/60">{total ? formatCurrency(total) : "--"}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-[var(--accent-1)]" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
