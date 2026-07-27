"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NewExpenseForm } from "@/components/app/NewExpenseForm";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatExpenseDate } from "@/lib/expense.utils";
import type { BudgetBucketKey, Category, Expense } from "@/types";

export function ExpenseQuickAddDialog({
  today,
  categories,
  quickCategories,
  defaultBudgetType,
  expense,
  onClose,
  action,
  onDelete,
}: {
  readonly today: string;
  readonly categories: Category[];
  readonly quickCategories: Category[];
  readonly defaultBudgetType: BudgetBucketKey;
  readonly expense: Expense | null;
  readonly onClose: () => void;
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly onDelete?: (id: string) => void | Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!expense);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsEditing(!expense);
    setConfirmingDelete(false);
    setError(null);
  }, [expense]);

  const handleAction = async (formData: FormData) => {
    setError(null);
    try {
      await action(formData);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!expense || !onDelete) return;

    setError(null);
    try {
      await onDelete(expense._id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 px-3 py-3 sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-[#121212] p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Expenses
            </p>
            <h2 id="quick-add-title" className="mt-1 break-words text-xl font-semibold">
              {expense ? (isEditing ? "Edit expense" : "Expense details") : "Quick add expense"}
            </h2>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
            {error}
          </div>
        ) : null}

        {expense && !isEditing ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-white/40">Amount</p>
                <p className="mt-1 text-4xl font-bold text-white">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-white/55 transition-colors hover:bg-white/10 hover:text-[var(--accent-1)]"
                aria-label="Edit expense"
                title="Edit expense"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge>{expense.category}</Badge>
              <Badge className="text-white/65">{expense.budgetType}</Badge>
              <span className="text-sm text-white/50">
                {formatExpenseDate(expense.date)}
              </span>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-[0.15em] text-white/40">Expense name</p>
              <p className="mt-1 break-words text-base text-white">{expense.name}</p>
            </div>

            {expense.description ? (
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/40">Note</p>
                <p className="mt-1 break-words text-sm text-white/70">{expense.description}</p>
              </div>
            ) : null}

            {onDelete ? (
              <div className="border-t border-white/10 pt-4">
                {confirmingDelete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-auto text-sm text-white/65">Delete this expense?</span>
                    <Button type="button" variant="ghost" onClick={handleDelete}>
                      Confirm delete
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(true)}>
                    Delete
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <NewExpenseForm
              key={expense?._id || "new"}
              action={handleAction}
              today={today}
              categories={categories}
              quickCategories={quickCategories}
              initialExpense={expense}
              defaultBudgetType={defaultBudgetType}
              allowRecurring={!expense}
            />
            {expense && isEditing && onDelete ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                {confirmingDelete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-auto text-sm text-white/65">Delete this expense?</span>
                    <Button type="button" variant="ghost" onClick={handleDelete}>
                      Confirm delete
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(true)}>
                    Delete
                  </Button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
