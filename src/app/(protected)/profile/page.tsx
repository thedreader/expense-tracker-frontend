"use client";

import { useEffect, useMemo, useState } from "react";
import { getExpenses, showRecurringCharges } from "@/lib/expense.api";
import { getCurrentUser } from "@/lib/user.api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecurringChargesPanel } from "@/components/app/RecurringChargesPanel";
import type { Expense, RecurringCharge, User } from "@/types";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "INR",
  });
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringCharges, setRecurringCharges] = useState<RecurringCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userData, expensesData, recurringData] = await Promise.all([
          getCurrentUser(),
          getExpenses(),
          showRecurringCharges(),
        ]);
        if (!active) return;
        setUser(userData);
        setExpenses(expensesData);
        setRecurringCharges(recurringData);
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
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const { total, lastExpense } = useMemo(() => {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const latest = [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return { total: totalAmount, lastExpense: latest };
  }, [expenses]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
        {error || "Unable to load profile data."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Profile</p>
        <h1 className="text-3xl font-semibold">Your account</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Personal details</h2>
          <div className="space-y-3">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Name</div>
              <div className="text-white text-lg">{user.name}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Email</div>
              <div className="text-white text-lg">{user.email}</div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Quick stats</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-white/60">Total logged</div>
              <div className="text-2xl font-semibold">{formatCurrency(total)}</div>
            </div>
            <div>
              <div className="text-sm text-white/60">Latest expense</div>
              {lastExpense ? (
                <div className="mt-2">
                  <div className="text-sm font-semibold">{lastExpense.name}</div>
                  <div className="text-xs text-white/60">
                    {new Date(lastExpense.date).toLocaleDateString()}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge>{lastExpense.category}</Badge>
                    <Badge className="text-white/65">{lastExpense.budgetType}</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/40">No expenses yet.</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recurring charges</h2>
          <span className="text-xs text-white/50">{recurringCharges.length} active</span>
        </div>
        <RecurringChargesPanel recurringCharges={recurringCharges} />
      </Card>
    </div>
  );
}
