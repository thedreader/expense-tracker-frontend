"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { BudgetBucketKey, Category } from "@/types";

type RecurringDraft = {
  amount?: string;
  category?: string;
  budgetType?: BudgetBucketKey;
  name?: string;
  description?: string;
  startDate?: string;
};

type FieldErrors = {
  amount?: string;
  category?: string;
  budgetType?: string;
  name?: string;
  interval?: string;
  startDate?: string;
};

export function RecurringExpenseForm({
  action,
  today,
  categories,
  initialValues,
}: {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly today: string;
  readonly categories: Category[];
  readonly initialValues?: RecurringDraft;
}) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const initialCategory =
    initialValues?.category || categories[0]?._id || "";

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const nextErrors: FieldErrors = {};
    const amount = Number(formData.get("amount"));
    const interval = Number(formData.get("interval"));
    const name = String(formData.get("name") || "").trim();

    if (!Number.isFinite(amount) || amount < 1) {
      nextErrors.amount = "Amount must be at least 1.";
    }
    if (!name) nextErrors.name = "Expense name is required.";
    if (!String(formData.get("category") || "").trim()) {
      nextErrors.category = "Category is required.";
    }
    if (!String(formData.get("budgetType") || "").trim()) {
      nextErrors.budgetType = "Budget type is required.";
    }
    if (!Number.isFinite(interval) || interval < 1) {
      nextErrors.interval = "Interval must be at least 1.";
    }
    if (!String(formData.get("startDate") || "").trim()) {
      nextErrors.startDate = "Start date is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
  };

  return (
    <form action={action} className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm text-white/80">
            Expense name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={initialValues?.name || ""}
            required
            aria-invalid={Boolean(fieldErrors.name)}
            placeholder="Groceries, rent, coffee"
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
          />
          {fieldErrors.name ? (
            <p className="text-sm text-[var(--accent-3)]">{fieldErrors.name}</p>
          ) : null}
        </div>
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
            defaultValue={initialValues?.amount || ""}
            aria-invalid={Boolean(fieldErrors.amount)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
          />
          {fieldErrors.amount ? (
            <p className="text-sm text-[var(--accent-3)]">{fieldErrors.amount}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm text-white/80">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initialCategory}
            required
            aria-invalid={Boolean(fieldErrors.category)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.category ? (
            <p className="text-sm text-[var(--accent-3)]">{fieldErrors.category}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="budgetType" className="text-sm text-white/80">
            Budget type
          </label>
          <select
            id="budgetType"
            name="budgetType"
            defaultValue={initialValues?.budgetType || "wants"}
            required
            aria-invalid={Boolean(fieldErrors.budgetType)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
          >
            <option value="needs">Needs</option>
            <option value="wants">Wants</option>
            <option value="investments">Investments</option>
          </select>
          {fieldErrors.budgetType ? (
            <p className="text-sm text-[var(--accent-3)]">{fieldErrors.budgetType}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="frequency" className="text-sm text-white/80">
            Frequency
          </label>
          <select
            id="frequency"
            name="frequency"
            defaultValue="monthly"
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
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
            defaultValue="1"
            aria-invalid={Boolean(fieldErrors.interval)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
          />
          {fieldErrors.interval ? (
            <p className="text-sm text-[var(--accent-3)]">{fieldErrors.interval}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm text-white/80">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={initialValues?.startDate || today}
            required
            aria-invalid={Boolean(fieldErrors.startDate)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
          />
          {fieldErrors.startDate ? (
            <p className="text-sm text-[var(--accent-3)]">{fieldErrors.startDate}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="endDate" className="text-sm text-white/80">
            End date <span className="text-white/40">(optional)</span>
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-base text-white focus:border-[var(--accent-1)] focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm text-white/80">
          Note <span className="text-white/40">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description || ""}
          placeholder="Optional notes about this recurring charge"
          className="min-h-[110px] w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
        />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save recurring charge"}
    </Button>
  );
}
