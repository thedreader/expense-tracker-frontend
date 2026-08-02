"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NewExpenseForm, type ExpenseFormValues } from "@/components/app/NewExpenseForm";
import { parseExpenseText, type AiExpenseDraft } from "@/lib/ai.api";
import { createExpenses, getExpenses, type ExpenseInput } from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import {
  formatCurrency,
  getMostRecentBudgetType,
  getTodayInputDate,
  rankQuickCategories,
} from "@/lib/expense.utils";
import type { BudgetBucketKey, Category, Expense } from "@/types";

type Step = "input" | "drafts";

type DraftEntry = {
  id: number;
  values: ExpenseFormValues;
  expanded: boolean;
  needsCategory: boolean;
  error?: string;
};

function buildDraft(
  id: number,
  raw: AiExpenseDraft,
  categories: Category[],
  today: string,
): DraftEntry {
  const matchedCategory = raw.category
    ? categories.find((c) => c.name.toLowerCase() === raw.category!.toLowerCase())
    : null;

  return {
    id,
    expanded: false,
    needsCategory: !matchedCategory,
    values: {
      amount: String(raw.amount),
      name: raw.name || "",
      description: "",
      category: matchedCategory?._id || "",
      budgetType: (["needs", "wants", "investments"].includes(raw.budgetType) ? raw.budgetType : "wants") as BudgetBucketKey,
      date: raw.date || today,
    },
  };
}

type FrequentExpense = { label: string; name: string; amount: number };

function getFrequentExpenses(expenses: Expense[], limit = 5): FrequentExpense[] {
  const counts = new Map<string, { count: number; name: string; amount: number }>();
  for (const expense of expenses) {
    const key = `${expense.name.toLowerCase()}|${expense.amount}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { count: 1, name: expense.name, amount: expense.amount });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => ({
      label: `${item.name} · ₹${item.amount}`,
      name: item.name,
      amount: item.amount,
    }));
}

export default function AiExpenseModal({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Data loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const today = useMemo(() => getTodayInputDate(), []);

  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), getExpenses()])
      .then(([cats, exps]) => {
        if (!active) return;
        setCategories(cats);
        setRecentExpenses(exps);
        setDataLoaded(true);
      })
      .catch(() => {
        if (active) setDataLoaded(true);
      });
    return () => { active = false; };
  }, []);

  const quickCategories = useMemo(
    () => rankQuickCategories(categories, recentExpenses),
    [categories, recentExpenses],
  );
  const defaultBudgetType = useMemo(
    () => getMostRecentBudgetType(recentExpenses),
    [recentExpenses],
  );
  const frequentExpenses = useMemo(
    () => getFrequentExpenses(recentExpenses),
    [recentExpenses],
  );

  // Step 1 state
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [parsing, setParsing] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Step 2 state
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nextId = useRef(0);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, drafts]);

  // Focus textarea on open
  useEffect(() => {
    if (step === "input") {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const hasDrafts = step === "drafts" && drafts.length > 0;

  const handleClose = () => {
    if (hasDrafts) {
      const confirmClose = window.confirm("You have unsaved expenses. Discard them?");
      if (!confirmClose) return;
    }
    onClose();
  };

  // --- Step 1: Parse ---
  const handleParse = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setInputError("Type what you spent — e.g. \"450 groceries yesterday\"");
      return;
    }

    setParsing(true);
    setInputError(null);

    try {
      const { drafts: parsed } = await parseExpenseText(trimmed);
      if (!parsed || parsed.length === 0) {
        setInputError("Couldn't find any expenses in your text. Try being more specific.");
        return;
      }

      const draftEntries = parsed.map((raw) => {
        const id = nextId.current;
        nextId.current += 1;
        return buildDraft(id, raw, categories, today);
      });

      // Auto-expand first, or any that need category
      if (draftEntries.length > 0) draftEntries[0].expanded = true;
      draftEntries.forEach((d) => { if (d.needsCategory) d.expanded = true; });

      setDrafts(draftEntries);
      setStep("drafts");
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string; name?: string };
      if (error.name === "AbortError") {
        setInputError("Taking too long — please try again with fewer expenses.");
      } else if (error.status === 429) {
        setInputError("AI is rate-limited, try again in a bit.");
      } else if (error.status === 504) {
        setInputError("AI took too long — please try again.");
      } else {
        setInputError(error.message || "Something went wrong. Try again.");
      }
    } finally {
      setParsing(false);
    }
  };

  const insertChip = (chip: FrequentExpense) => {
    const current = text.trim();
    const addition = `${chip.name} ${chip.amount}`;
    setText(current ? `${current}, ${addition}` : addition);
    textareaRef.current?.focus();
  };

  // --- Step 2: Draft management ---
  const handleValuesChange = useCallback((id: number, values: ExpenseFormValues) => {
    setSaveError(null);
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== id) return draft;
        const hasCategory = values.category !== "";
        return { ...draft, values, needsCategory: !hasCategory, error: undefined };
      }),
    );
  }, []);

  const removeDraft = (id: number) => {
    setDrafts((current) =>
      current.length > 1 ? current.filter((d) => d.id !== id) : current,
    );
  };

  const toggleDraft = (id: number) => {
    setDrafts((current) =>
      current.map((d) =>
        d.id === id ? { ...d, expanded: !d.expanded } : d,
      ),
    );
  };

  const total = drafts.reduce((sum, d) => {
    const amount = Number(d.values.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const hasInvalidDrafts = drafts.some((d) => d.needsCategory || !d.values.amount || Number(d.values.amount) <= 0);

  const handleSave = async () => {
    if (saving || drafts.length === 0) return;

    // Check all drafts have categories
    const missingCategory = drafts.some((d) => !d.values.category);
    if (missingCategory) {
      setSaveError("Every expense needs a category. Expand flagged cards to fix.");
      return;
    }

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
        onClose();
        router.refresh();
        return;
      }

      setDrafts(
        drafts.flatMap((draft, index) => {
          const reason = failedByIndex.get(index);
          return reason ? [{ ...draft, error: reason, expanded: true }] : [];
        }),
      );
      setSaveError("Some expenses could not be saved. Review the marked cards.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save expenses.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setStep("input");
    setDrafts([]);
    setSaveError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 px-3 py-3 sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      onClick={handleClose}
    >
      <div
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-[#121212] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              AI Assistant
            </p>
            <h2 id="ai-modal-title" className="mt-1 text-xl font-semibold">
              {step === "input" ? "Log an expense" : "Review expenses"}
            </h2>
            {step === "input" ? (
              <p className="mt-1 text-sm text-white/50">
                Describe your spending in plain text and we&apos;ll parse it for you.
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Close
          </Button>
        </div>

        {/* Step 1: Text input */}
        {step === "input" ? (
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder={'e.g. "spent 450 on groceries yesterday, 200 coffee today, 1200 uber last friday"'}
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent-1)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-1)]/30 transition-colors"
            />

            {/* Suggestion chips */}
            {frequentExpenses.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Quick add
                </div>
                <div className="flex flex-wrap gap-2">
                  {frequentExpenses.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => insertChip(chip)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-[var(--accent-1)]/40 hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)]"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {inputError ? (
              <div className="rounded-xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
                {inputError}
              </div>
            ) : null}

            <Button
              type="button"
              className="w-full"
              disabled={parsing || !dataLoaded}
              onClick={handleParse}
            >
              {parsing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Parsing…
                </span>
              ) : (
                "Add expenses"
              )}
            </Button>
          </div>
        ) : null}

        {/* Step 2: Drafts */}
        {step === "drafts" ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
            >
              ← Back to text
            </button>

            {saveError ? (
              <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
                {saveError}
              </div>
            ) : null}

            <div className="space-y-3">
              {drafts.map((draft, index) => {
                const categoryName =
                  categories.find((c) => c._id === draft.values.category)?.name ||
                  "No category";

                return (
                  <Card key={draft.id} className="w-full">
                    {draft.expanded ? (
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.15em] text-white/40">
                          Expense {index + 1}
                          {draft.needsCategory ? (
                            <span className="ml-2 text-[var(--accent-3)]">
                              — pick a category
                            </span>
                          ) : null}
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
                          <span className="font-semibold">
                            {formatCurrency(Number(draft.values.amount) || 0)}
                          </span>
                          {" · "}
                          {draft.needsCategory ? (
                            <span className="text-[var(--accent-3)]">Pick category</span>
                          ) : (
                            categoryName
                          )}
                          {" · "}
                          {draft.values.name || "Unnamed"}
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
                          allowRecurring={false}
                          onValuesChange={(values) => handleValuesChange(draft.id, values)}
                        />
                      </>
                    ) : null}
                  </Card>
                );
              })}
            </div>

            {/* Save bar */}
            <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-white/10 bg-[#121212] px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {drafts.length} {drafts.length === 1 ? "expense" : "expenses"}
                  </div>
                  <div className="text-sm text-white/50">
                    Total · {formatCurrency(total)}
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={saving || drafts.length === 0 || hasInvalidDrafts}
                  onClick={handleSave}
                >
                  {saving
                    ? "Saving…"
                    : `Save ${drafts.length} ${drafts.length === 1 ? "expense" : "expenses"} · ${formatCurrency(total)}`}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
