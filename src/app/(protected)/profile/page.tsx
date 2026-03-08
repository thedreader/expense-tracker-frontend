import { cookies } from "next/headers";
import { getExpenses, showRecurringCharges } from "@/lib/expense.api";
import { getCurrentUser } from "@/lib/user.api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecurringChargesPanel } from "@/components/app/RecurringChargesPanel";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "INR",
  });
}

export default async function ProfilePage() {
  const cookieHeader = (await cookies()).toString();

  const [user, expenses, recurringCharges] = await Promise.all([
    getCurrentUser(cookieHeader),
    getExpenses(cookieHeader),
    showRecurringCharges(cookieHeader),
  ]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const lastExpense = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

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
