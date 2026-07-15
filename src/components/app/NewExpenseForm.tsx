"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  formatExpenseDate,
  toInputDate,
} from "@/lib/expense.utils";
import type { BudgetBucketKey, Category, Expense } from "@/types";

const BUDGET_OPTIONS: { value: BudgetBucketKey; label: string }[] = [
  { value: "needs", label: "Needs" },
  { value: "wants", label: "Wants" },
  { value: "investments", label: "Investments" },
];

type FieldErrors = {
  amount?: string;
  category?: string;
  budgetType?: string;
  date?: string;
};

export function NewExpenseForm({
  action,
  today,
  categories,
  quickCategories = categories,
  initialExpense,
  defaultBudgetType = "wants",
  allowRecurring = true,
}: {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly today: string;
  readonly categories: Category[];
  readonly quickCategories?: Category[];
  readonly initialExpense?: Expense | null;
  readonly defaultBudgetType?: BudgetBucketKey;
  readonly allowRecurring?: boolean;
}) {
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);
  const initialCategory =
    initialExpense?.categoryId ||
    categories.find((category) => category.name === initialExpense?.category)?._id ||
    categories[0]?._id ||
    "";
  const initialDate = initialExpense ? toInputDate(initialExpense.date) : today;

  const [amount, setAmount] = useState(initialExpense ? String(initialExpense.amount) : "");
  const [name, setName] = useState(initialExpense?.name || "");
  const [description, setDescription] = useState(initialExpense?.description || "");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBudgetType, setSelectedBudgetType] = useState<BudgetBucketKey>(
    initialExpense?.budgetType || defaultBudgetType,
  );
  const [date, setDate] = useState(initialDate);
  const [dateEditing, setDateEditing] = useState(Boolean(initialExpense && initialDate !== today));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const visibleCategories = useMemo(() => {
    if (showAllCategories) return categories;

    const quick = quickCategories.length > 0 ? quickCategories : categories.slice(0, 5);
    const selected = categories.find((category) => category._id === selectedCategory);
    if (selected && !quick.some((category) => category._id === selected._id)) {
      return [selected, ...quick].slice(0, 6);
    }
    return quick;
  }, [categories, quickCategories, selectedCategory, showAllCategories]);

  const handleRecurringHandoff = () => {
    const params = new URLSearchParams();
    if (amount.trim()) params.set("amount", amount.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBudgetType) params.set("budgetType", selectedBudgetType);
    if (date) params.set("startDate", date);
    if (name.trim()) params.set("name", name.trim());
    if (description.trim()) params.set("description", description.trim());
    router.push(`/expenses/new/recurring?${params.toString()}`);
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors: FieldErrors = {};
    const amountValue = Number(formData.get("amount"));
    const category = String(formData.get("category") || "").trim();
    const budgetType = String(formData.get("budgetType") || "").trim();
    const inputDate = String(formData.get("date") || "").trim();

    if (!Number.isFinite(amountValue) || amountValue < 1) {
      nextErrors.amount = "Amount must be at least 1.";
    }
    if (!category) nextErrors.category = "Category is required.";
    if (!budgetType) nextErrors.budgetType = "Budget type is required.";
    if (!inputDate) nextErrors.date = "Date is required.";

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
  };

  const amountIsValid = Number.isFinite(Number(amount)) && Number(amount) >= 1;
  const canSave = amountIsValid && Boolean(selectedCategory);

  return (
    <form action={action} className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <label htmlFor="amount" className="text-sm text-white/70">
          Amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/40">
            ₹
          </span>
          <input
            ref={amountRef}
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={Boolean(fieldErrors.amount)}
            placeholder="0.00"
            className="h-20 w-full rounded-2xl border border-white/10 bg-[var(--panel-2)] pl-11 pr-4 text-4xl font-semibold text-white placeholder:text-white/25 focus:border-[var(--accent-1)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,255,133,0.2)]"
          />
        </div>
        {fieldErrors.amount ? (
          <p className="text-xs text-[var(--accent-3)]">{fieldErrors.amount}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <span className="text-sm text-white/70">Category</span>
        <input type="hidden" name="category" value={selectedCategory} />
        <div className="flex flex-wrap gap-2">
          {visibleCategories.map((category) => {
            const selected = category._id === selectedCategory;
            return (
              <button
                key={category._id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedCategory(category._id)}
                className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "border-[var(--accent-1)] bg-[var(--accent-1)] text-[#0D0D0D]"
                    : "border-white/15 bg-white/5 text-white/75 hover:border-white/35 hover:text-white"
                }`}
              >
                {category.name}
              </button>
            );
          })}
          {!showAllCategories && categories.length > visibleCategories.length ? (
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-[var(--accent-1)] transition-colors hover:border-white/35 hover:text-white"
            >
              More
            </button>
          ) : null}
        </div>
        {fieldErrors.category ? (
          <p className="text-xs text-[var(--accent-3)]">{fieldErrors.category}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <span className="text-sm text-white/70">Budget type</span>
        <input type="hidden" name="budgetType" value={selectedBudgetType} />
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((option) => {
            const selected = option.value === selectedBudgetType;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedBudgetType(option.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[var(--accent-1)] bg-[var(--accent-1)] text-[#0D0D0D]"
                    : "border-white/15 bg-white/5 text-white/65 hover:border-white/35 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {fieldErrors.budgetType ? (
          <p className="text-xs text-[var(--accent-3)]">{fieldErrors.budgetType}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <div className="text-sm text-white/80">Date</div>
          {!dateEditing ? (
            <div className="mt-1 text-sm font-semibold text-white">{formatExpenseDate(date)}</div>
          ) : null}
        </div>
        <input
          id="date"
          name="date"
          type={dateEditing ? "date" : "hidden"}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.date)}
          className={dateEditing ? "h-10 rounded-xl border border-white/10 bg-[var(--panel-2)] px-3 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none" : undefined}
        />
        <button
          type="button"
          onClick={() => setDateEditing((current) => !current)}
          className="text-xs font-semibold text-[var(--accent-1)] hover:text-white"
        >
          {dateEditing ? "Done" : "Edit"}
        </button>
      </div>
      {fieldErrors.date ? (
        <p className="-mt-4 text-xs text-[var(--accent-3)]">{fieldErrors.date}</p>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5">
        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          aria-expanded={detailsOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/80"
        >
          <span>Add details</span>
          <span className="text-white/50">{detailsOpen ? "−" : "+"}</span>
        </button>
        {detailsOpen ? (
          <div className="space-y-4 border-t border-white/10 px-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-white/70">
                Expense name <span className="text-white/40">(optional)</span>
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Defaults to the category name"
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm text-white/70">
                Note <span className="text-white/40">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional notes about this expense"
                className="min-h-[100px] w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
            {allowRecurring ? (
              <button
                type="button"
                onClick={handleRecurringHandoff}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition-colors hover:border-white/25 hover:bg-white/10"
              >
                <span>Recurring charge</span>
                <span className="text-xs text-white/50">Set up separately →</span>
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="description" value={description} />
          </>
        )}
      </div>

      <SubmitButton disabled={!canSave} />
    </form>
  );
}

function SubmitButton({ disabled }: { readonly disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className="w-full sm:w-auto">
      {pending ? "Saving..." : "Save expense"}
    </Button>
  );
}
