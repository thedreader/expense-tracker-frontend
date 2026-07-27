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
  name?: string;
  date?: string;
};

export type ExpenseFormValues = {
  amount: string;
  name: string;
  description: string;
  category: string;
  budgetType: BudgetBucketKey;
  date: string;
};

export function NewExpenseForm({
  action,
  today,
  categories,
  quickCategories = categories,
  initialExpense,
  initialValues,
  defaultBudgetType = "wants",
  allowRecurring = true,
  showSubmit = true,
  onValuesChange,
  formRef,
}: {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly today: string;
  readonly categories: Category[];
  readonly quickCategories?: Category[];
  readonly initialExpense?: Expense | null;
  readonly initialValues?: Partial<ExpenseFormValues>;
  readonly defaultBudgetType?: BudgetBucketKey;
  readonly allowRecurring?: boolean;
  readonly showSubmit?: boolean;
  readonly onValuesChange?: (values: ExpenseFormValues) => void;
  readonly formRef?: React.Ref<HTMLFormElement>;
}) {
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);
  const initialCategory =
    initialValues?.category ||
    initialExpense?.categoryId ||
    categories.find((category) => category.name === initialExpense?.category)?._id ||
    categories[0]?._id ||
    "";
  const initialDate =
    initialValues?.date || (initialExpense ? toInputDate(initialExpense.date) : today);

  const [amount, setAmount] = useState(
    initialValues?.amount ?? (initialExpense ? String(initialExpense.amount) : ""),
  );
  const [name, setName] = useState(initialValues?.name ?? initialExpense?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? initialExpense?.description ?? "",
  );
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBudgetType, setSelectedBudgetType] = useState<BudgetBucketKey>(
    initialValues?.budgetType || initialExpense?.budgetType || defaultBudgetType,
  );
  const [date, setDate] = useState(initialDate);
  const dateRef = useRef<HTMLInputElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  useEffect(() => {
    onValuesChangeRef.current?.({
      amount,
      name,
      description,
      category: selectedCategory,
      budgetType: selectedBudgetType,
      date,
    });
  }, [amount, name, description, selectedCategory, selectedBudgetType, date]);

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
    const expenseName = String(formData.get("name") || "").trim();
    const inputDate = String(formData.get("date") || "").trim();

    if (!Number.isFinite(amountValue) || amountValue < 1) {
      nextErrors.amount = "Amount must be at least 1.";
    }
    if (!category) nextErrors.category = "Category is required.";
    if (!budgetType) nextErrors.budgetType = "Budget type is required.";
    if (!expenseName) nextErrors.name = "Expense name is required.";
    if (!inputDate) nextErrors.date = "Date is required.";

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
  };

  const amountIsValid = Number.isFinite(Number(amount)) && Number(amount) >= 1;
  const canSave = amountIsValid && Boolean(selectedCategory) && Boolean(name.trim());

  return (
    <form ref={formRef} action={action} className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <div className="text-center text-xs uppercase tracking-[0.15em] text-white/40">
          Amount
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-3xl text-white/30">
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
            placeholder="0"
            style={{ fontSize: "56px" }}
            className="h-20 w-52 border-0 bg-transparent p-0 text-center leading-none font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-0 sm:w-64"
          />
        </div>
        {fieldErrors.amount ? (
          <p className="text-sm text-[var(--accent-3)]">{fieldErrors.amount}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.15em] text-white/40">Category</span>
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
                className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[var(--accent-1)] bg-[var(--accent-1)] text-[#0D0D0D]"
                    : "border-white/15 bg-white/5 text-white/65 hover:border-white/35 hover:text-white"
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
              className="min-h-11 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--accent-1)] transition-colors hover:border-white/35 hover:text-white"
            >
              More
            </button>
          ) : null}
        </div>
        {fieldErrors.category ? (
          <p className="text-sm text-[var(--accent-3)]">{fieldErrors.category}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.15em] text-white/40">Budget type</span>
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
                className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
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
          <p className="text-sm text-[var(--accent-3)]">{fieldErrors.budgetType}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-xs uppercase tracking-[0.15em] text-white/40">
          Expense name
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          aria-invalid={Boolean(fieldErrors.name)}
          placeholder="Groceries, rent, coffee"
          className="h-11 w-full rounded-none border-0 border-b border-white/15 bg-transparent px-0 text-base text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none focus:ring-0"
        />
        {fieldErrors.name ? (
          <p className="text-sm text-[var(--accent-3)]">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="text-xs uppercase tracking-[0.15em] text-white/40 mb-2">Date</div>
        <div
          className="relative flex min-h-11 cursor-pointer items-center gap-3 group"
          onClick={() => dateRef.current?.showPicker?.()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/50 group-hover:text-[var(--accent-1)] transition-colors shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-semibold text-white group-hover:text-[var(--accent-1)] transition-colors">
            {formatExpenseDate(date)}
          </span>
          <input
            ref={dateRef}
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrors.date)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer text-base"
          />
        </div>
        {fieldErrors.date ? (
          <p className="mt-2 text-sm text-[var(--accent-3)]">{fieldErrors.date}</p>
        ) : null}
      </div>

      <div className="border-t border-white/10">
        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          aria-expanded={detailsOpen}
          className="flex min-h-11 w-full items-center justify-between py-3 text-left text-xs uppercase tracking-[0.15em] text-white/40"
        >
          <span>Add details</span>
          <span className="text-white/50 text-sm">{detailsOpen ? "−" : "+"}</span>
        </button>
        {detailsOpen ? (
          <div className="space-y-4 border-t border-white/10 py-4">
            <div className="space-y-2">
              <label htmlFor="description" className="text-xs uppercase tracking-[0.15em] text-white/40">
                Note <span className="normal-case tracking-normal text-white/30">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional notes about this expense"
                className="min-h-[100px] w-full rounded-none border-0 border-b border-white/15 bg-transparent px-0 py-3 text-base text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none focus:ring-0"
              />
            </div>
            {allowRecurring ? (
              <button
                type="button"
                onClick={handleRecurringHandoff}
                className="flex min-h-11 w-full items-center justify-between border-t border-white/10 px-0 py-3 text-left text-sm text-white/80 transition-colors hover:text-white"
              >
                <span>Recurring charge</span>
                <span className="text-xs text-white/50">Set up separately →</span>
              </button>
            ) : null}
          </div>
        ) : (
          <input type="hidden" name="description" value={description} />
        )}
      </div>

      {showSubmit ? <SubmitButton disabled={!canSave} /> : null}
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
