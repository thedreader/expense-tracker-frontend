"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecurringCharge } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { editRecurringCharge, recurringChargeStop } from "@/lib/expense.api";
import {
  formatCurrency,
  formatExpenseDate,
  getTodayInputDate,
  toInputDate,
} from "@/lib/expense.utils";

export function RecurringChargesPanel({
  recurringCharges,
}: {
  readonly recurringCharges: RecurringCharge[];
}) {
  const router = useRouter();
  const [active, setActive] = useState<RecurringCharge | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => getTodayInputDate(), []);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActive(null);
      setIsClosing(false);
      setError(null);
    }, 220);
  };

  const handleStop = async (recurringChargeId: string) => {
    await recurringChargeStop(recurringChargeId);
    router.refresh();
  };

  const handleSave = async (formData: FormData) => {
    if (!active) return;
    setIsSaving(true);
    setError(null);

    const startDateValue = formData.get("startDate");
    const startDate = typeof startDateValue === "string" ? startDateValue : "";
    if (startDate && startDate < today) {
      setError("Start date can't be less than today.");
      setIsSaving(false);
      return;
    }

    try {
      const frequency = formData.get("frequency");
      const endDateValue = formData.get("endDate");
      const endDate = typeof endDateValue === "string" ? endDateValue : "";
      const descriptionValue = formData.get("description");
      const description = typeof descriptionValue === "string" ? descriptionValue : "";
      const budgetTypeValue = formData.get("budgetType");
      const budgetType =
        typeof budgetTypeValue === "string"
          ? (budgetTypeValue as "needs" | "wants" | "investments")
          : active.budgetType;

      const payload: Parameters<typeof editRecurringCharge>[0] = {
        recurringChargeId: active._id,
        amount: Number(formData.get("amount") || 0),
        frequency: (typeof frequency === "string" ? frequency : "monthly") as
          | "daily"
          | "weekly"
          | "monthly"
          | "yearly",
        interval: Number(formData.get("interval") || 1),
        startDate,
        endDate,
        description,
      };

      if (budgetType !== active.budgetType) {
        payload.budgetType = budgetType;
      }

      await editRecurringCharge(payload);

      closeModal();
      setTimeout(() => {
        router.refresh();
      }, 220);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {recurringCharges.length === 0 ? (
        <p className="text-sm text-white/50">No active recurring charges.</p>
      ) : (
        <div className="space-y-3">
          {recurringCharges.map((charge) => (
            <button
              key={charge._id}
              type="button"
              onClick={() => setActive(charge)}
              className="min-w-0 w-full text-left rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 ease-out hover:border-white/20 hover:bg-white/10 hover:translate-y-[-1px]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="break-words text-sm font-semibold">{charge.name}</div>
                  <div className="text-xs text-white/60">
                    {charge.frequency}
                  </div>
                  <div className="text-xs text-white/50">
                    Starts {formatExpenseDate(charge.startDate)}
                    {charge.endDate
                      ? ` | Ends ${formatExpenseDate(charge.endDate)}`
                      : " | No end date"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{charge.category}</Badge>
                  <Badge className="text-white/65">{charge.budgetType}</Badge>
                  <span className="text-sm font-semibold">
                    {formatCurrency(charge.amount)}
                  </span>
                  <span
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="transition-colors duration-300 hover:bg-[rgba(255,0,153,0.2)] hover:text-white"
                      onClick={() => handleStop(charge._id)}
                    >
                      Stop
                    </Button>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {active ? (
        <dialog
          open
          className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-4 transition-opacity duration-200 sm:items-center ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeModal}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeModal();
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#121212] p-5 shadow-2xl transition-all duration-200 sm:p-6 ${
              isClosing
                ? "opacity-0 scale-95 translate-y-2"
                : "opacity-100 scale-100 translate-y-0"
            }`}
            aria-labelledby="modal-title"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 id="modal-title" className="min-w-0 break-words text-lg font-semibold">Edit recurring charge</h3>
              <button
                type="button"
                onClick={closeModal}
                className="min-h-11 shrink-0 rounded-xl px-3 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            {error ? (
              <div className="mb-4 rounded-xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-2 text-sm text-white">
                {error}
              </div>
            ) : null}

            <form action={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm text-white/80">
                    Amount
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    defaultValue={active.amount}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="frequency" className="text-sm text-white/80">
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    name="frequency"
                    defaultValue={active.frequency}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="budgetType" className="text-sm text-white/80">
                    Budget type
                  </label>
                  <select
                    id="budgetType"
                    name="budgetType"
                    defaultValue={active.budgetType}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
                  >
                    <option value="needs">Needs</option>
                    <option value="wants">Wants</option>
                    <option value="investments">Investments</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="interval" className="text-sm text-white/80">
                    Interval
                  </label>
                  <input
                    id="interval"
                    name="interval"
                    type="number"
                    min="1"
                    required
                    defaultValue={active.interval}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm text-white/80">
                    Start date
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    min={today}
                    defaultValue={toInputDate(active.startDate) || today}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="endDate" className="text-sm text-white/80">
                    End date
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={toInputDate(active.endDate)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm text-white/80">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={active.description || ""}
                  className="min-h-[110px] w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
