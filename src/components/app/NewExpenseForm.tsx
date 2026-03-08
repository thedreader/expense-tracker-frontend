"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function NewExpenseForm({
  action,
  today,
  categories,
}: {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly today: string;
  readonly categories: { _id: string; name: string }[];
}) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    amount?: string;
    category?: string;
    date?: string;
    interval?: string;
    startDate?: string;
  }>({});

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const nextErrors: typeof fieldErrors = {};

    const name = typeof formData.get("name") === "string" ? (formData.get("name") as string).trim() : "";
    const amount = Number(formData.get("amount")) || 0;
    const category = typeof formData.get("category") === "string" ? (formData.get("category") as string).trim() : "";
    const date = typeof formData.get("date") === "string" ? (formData.get("date") as string).trim() : "";

    if (!name) nextErrors.name = "Expense name is required.";
    if (!Number.isFinite(amount) || amount < 1) {
      nextErrors.amount = "Amount must be at least 1.";
    }
    if (!category) nextErrors.category = "Category is required.";
    if (!date) nextErrors.date = "Date is required.";

    if (isRecurring) {
      const interval = Number(formData.get("interval") || 0);
      const startDate = typeof formData.get("startDate") === "string" ? (formData.get("startDate") as string).trim() : "";
      if (!Number.isFinite(interval) || interval < 1) {
        nextErrors.interval = "Interval must be at least 1.";
      }
      if (!startDate) {
        nextErrors.startDate = "Start date is required.";
      }
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
            required
            aria-invalid={Boolean(fieldErrors.name)}
            placeholder="Groceries, rent, coffee"
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
          />
          {fieldErrors.name ? (
            <p className="text-xs text-[var(--accent-3)]">{fieldErrors.name}</p>
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
            aria-invalid={Boolean(fieldErrors.amount)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
          />
          {fieldErrors.amount ? (
            <p className="text-xs text-[var(--accent-3)]">{fieldErrors.amount}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm text-white/80">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categories[0]?._id || ""}
            required
            aria-invalid={Boolean(fieldErrors.category)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.category ? (
            <p className="text-xs text-[var(--accent-3)]">{fieldErrors.category}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm text-white/80">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            required
            aria-invalid={Boolean(fieldErrors.date)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
          />
          {fieldErrors.date ? (
            <p className="text-xs text-[var(--accent-3)]">{fieldErrors.date}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm text-white/80">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Optional notes about this expense"
          className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <label className="flex items-center gap-3 text-sm text-white/90">
          <input
            type="checkbox"
            name="isRecurring"
            checked={isRecurring}
            onChange={(event) => setIsRecurring(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent-1)]"
        />
          <span>Recurring charge</span>
        </label>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          isRecurring ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid gap-5 md:grid-cols-2 border border-white/10 rounded-xl p-4 bg-white/5">
          <div className="space-y-2">
            <label htmlFor="frequency" className="text-sm text-white/80">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              required={isRecurring}
              defaultValue="monthly"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
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
              required={isRecurring}
              aria-invalid={Boolean(fieldErrors.interval)}
              placeholder="1"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
            />
            {fieldErrors.interval ? (
              <p className="text-xs text-[var(--accent-3)]">{fieldErrors.interval}</p>
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
              defaultValue={today}
              required={isRecurring}
              aria-invalid={Boolean(fieldErrors.startDate)}
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
            {fieldErrors.startDate ? (
              <p className="text-xs text-[var(--accent-3)]">{fieldErrors.startDate}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm text-white/80">
              End date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save expense"}
    </Button>
  );
}
