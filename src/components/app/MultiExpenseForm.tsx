"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NewExpenseForm, type ExpenseFormValues } from "@/components/app/NewExpenseForm";
import { createExpenses, type ExpenseInput } from "@/lib/expense.api";
import { formatCurrency } from "@/lib/expense.utils";
import type { BudgetBucketKey, Category } from "@/types";

type ExpenseDraft = {
  id: number;
  values: ExpenseFormValues;
  expanded: boolean;
  error?: string;
};

function createDraft(
  id: number,
  values: Partial<ExpenseFormValues>,
  defaults: {
    category: string;
    budgetType: BudgetBucketKey;
    date: string;
  },
  expanded: boolean,
): ExpenseDraft {
  return {
    id,
    expanded,
    values: {
      amount: values.amount ?? "",
      name: values.name ?? "",
      description: values.description ?? "",
      category: values.category ?? defaults.category,
      budgetType: values.budgetType ?? defaults.budgetType,
      date: values.date ?? defaults.date,
    },
  };
}

export function MultiExpenseForm({
  today,
  categories,
  quickCategories,
  defaultBudgetType,
}: {
  readonly today: string;
  readonly categories: Category[];
  readonly quickCategories: Category[];
  readonly defaultBudgetType: BudgetBucketKey;
}) {
  const router = useRouter();
  const nextId = useRef(2);
  const defaults = useMemo(
    () => ({
      category: categories[0]?._id || "",
      budgetType: defaultBudgetType,
      date: today,
    }),
    [categories, defaultBudgetType, today],
  );
  const [drafts, setDrafts] = useState<ExpenseDraft[]>(() => [
    createDraft(1, {}, defaults, true),
  ]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleValuesChange = useCallback((id: number, values: ExpenseFormValues) => {
    setSaveError(null);
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, values, error: undefined } : draft,
      ),
    );
  }, []);

  const addAnother = () => {
    const previous = drafts[drafts.length - 1]?.values;
    const id = nextId.current;
    nextId.current += 1;
    setDrafts((current) => [
      ...current,
      createDraft(
        id,
        {
          category: previous?.category,
          budgetType: previous?.budgetType,
          date: previous?.date,
        },
        defaults,
        false,
      ),
    ]);
  };

  const removeDraft = (id: number) => {
    setDrafts((current) =>
      current.length > 1 ? current.filter((draft) => draft.id !== id) : current,
    );
  };

  const toggleDraft = (id: number) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, expanded: !draft.expanded } : draft,
      ),
    );
  };

  const total = drafts.reduce((sum, draft) => {
    const amount = Number(draft.values.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const handleSave = async () => {
    if (saving || drafts.length === 0) return;

    setSaving(true);
    setSaveError(null);

    const inputs: ExpenseInput[] = drafts.map(({ values }) => ({
      name: values.name.trim(),
      amount: Number(values.amount),
      description: values.description,
      category: values.category,
      date: values.date,
      budgetType: values.budgetType,
    }));

    try {
      const result = await createExpenses(inputs);
      const failedByIndex = new Map(
        result.failed.map(({ index, reason }) => [index, reason]),
      );

      if (failedByIndex.size === 0) {
        router.replace("/expenses");
        router.refresh();
        return;
      }

      setDrafts(
        drafts.flatMap((draft, index) => {
          const reason = failedByIndex.get(index);
          return reason
            ? [{ ...draft, error: reason, expanded: true }]
            : [];
        }),
      );
      setSaveError("Some expenses could not be saved. Review the marked cards.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save expenses.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {saveError ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {saveError}
        </div>
      ) : null}

      {drafts.map((draft, index) => {
        const categoryName =
          categories.find((category) => category._id === draft.values.category)?.name ||
          "No category";

        return (
          <Card key={draft.id} className="w-full">
            {draft.expanded ? (
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.15em] text-white/40">
                  Expense {index + 1}
                </span>
                {drafts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeDraft(draft.id)}
                    className="min-h-11 min-w-11 text-2xl leading-none text-white/45 hover:text-white"
                    aria-label={`Remove expense ${index + 1}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-11 items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDraft(draft.id)}
                  className="min-h-11 min-w-0 flex-1 truncate text-left text-sm text-white/80"
                >
                  {draft.values.amount || "0"} · {categoryName} · {draft.values.name || "Unnamed expense"}
                </button>
                <button
                  type="button"
                  onClick={() => removeDraft(draft.id)}
                  className="min-h-11 min-w-11 text-2xl leading-none text-white/45 hover:text-white"
                  aria-label={`Remove expense ${index + 1}`}
                >
                  ×
                </button>
              </div>
            )}

            {draft.expanded ? (
              <>
                {draft.error ? (
                  <p className="mb-4 rounded-xl border border-[var(--accent-3)]/30 bg-[rgba(255,0,153,0.08)] px-3 py-2 text-sm text-white">
                    {draft.error}
                  </p>
                ) : null}
                <NewExpenseForm
                  action={async () => undefined}
                  today={today}
                  categories={categories}
                  quickCategories={quickCategories}
                  defaultBudgetType={defaultBudgetType}
                  initialValues={draft.values}
                  showSubmit={false}
                  onValuesChange={(values) => handleValuesChange(draft.id, values)}
                />
              </>
            ) : null}
          </Card>
        );
      })}

      <Button type="button" variant="outline" className="w-full" onClick={addAnother}>
        + Add another expense
      </Button>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-[rgba(10,10,10,0.94)] px-4 py-3 backdrop-blur-md md:bottom-0 md:left-[260px] sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <div className="text-sm font-semibold text-white">
              {drafts.length} {drafts.length === 1 ? "expense" : "expenses"}
            </div>
            <div className="text-sm text-white/50">Total · {formatCurrency(total)}</div>
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={saving || drafts.length === 0}
            onClick={handleSave}
          >
            {saving
              ? "Saving..."
              : `Save ${drafts.length} ${drafts.length === 1 ? "expense" : "expenses"} · ${formatCurrency(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
