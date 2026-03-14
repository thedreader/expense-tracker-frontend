"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, updateCurrentUser } from "@/lib/user.api";
import { createCategory, deleteCategory, getCategories } from "@/lib/category.api";
import { getBudgetStatus, updateBudget } from "@/lib/budget.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Category, User } from "@/types";

type BudgetForm = {
  needs: string;
  wants: string;
  investments: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>({
    needs: "",
    wants: "",
    investments: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userData, categoriesData, budgetStatus] = await Promise.all([
          getCurrentUser(),
          getCategories(),
          getBudgetStatus(),
        ]);
        if (!active) return;
        setUser(userData);
        setCategories(categoriesData);
        setProfileForm({ name: userData.name, email: userData.email, password: "" });
        if ("month" in budgetStatus) {
          setBudgetForm({
            needs: budgetStatus.needs?.budget ? String(budgetStatus.needs.budget) : "",
            wants: budgetStatus.wants?.budget ? String(budgetStatus.wants.budget) : "",
            investments: budgetStatus.investments?.budget
              ? String(budgetStatus.investments.budget)
              : "",
          });
        }
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const parseBudgetValue = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const hasCategoryData = useMemo(() => categories.length > 0, [categories]);

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await updateCurrentUser({
        name: profileForm.name.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        password: profileForm.password.trim() || undefined,
      });
      setProfileForm((prev) => ({ ...prev, password: "" }));
      setSuccess("Profile updated successfully.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const name = newCategoryName.trim();
    if (!name) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      const response = await createCategory(name);
      setCategories((prev) => [...prev, response.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName("");
      setSuccess("Category added successfully.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((category) => category._id !== id));
      setSuccess("Category deleted successfully.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBudget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const payload = {
      needs: parseBudgetValue(budgetForm.needs),
      wants: parseBudgetValue(budgetForm.wants),
      investments: parseBudgetValue(budgetForm.investments),
    };

    if (
      payload.needs === undefined &&
      payload.wants === undefined &&
      payload.investments === undefined
    ) {
      setError("Provide at least one budget value.");
      return;
    }

    setSaving(true);
    try {
      await updateBudget(payload);
      setSuccess("Budget updated successfully.");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
        Unable to load account details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Settings</p>
        <h1 className="text-3xl font-semibold">Account settings</h1>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-[var(--accent-1)]/40 bg-[rgba(0,255,133,0.1)] px-4 py-3 text-sm text-white">
          {success}
        </div>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Update details</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm text-white/80">Name</label>
            <input
              id="name"
              name="name"
              value={profileForm.name}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-white/80">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-white/80">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={profileForm.password}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Leave blank to keep current"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={saving}>Save changes</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Manage categories</h2>
        <form onSubmit={handleAddCategory} className="flex flex-col gap-3 sm:flex-row mb-4">
          <input
            name="name"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="Add new category"
            className="h-11 flex-1 rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
          />
          <Button type="submit" disabled={saving}>Add category</Button>
        </form>

        {!hasCategoryData ? (
          <p className="text-sm text-white/50">No categories found.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category._id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-white/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white">{category.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => handleDeleteCategory(category._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Budget buckets</h2>
        <form onSubmit={handleUpdateBudget} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="needs" className="text-sm text-white/80">Needs</label>
            <input
              id="needs"
              name="needs"
              type="number"
              min="1"
              step="0.01"
              value={budgetForm.needs}
              onChange={(event) =>
                setBudgetForm((prev) => ({ ...prev, needs: event.target.value }))
              }
              placeholder="Optional"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="wants" className="text-sm text-white/80">Wants</label>
            <input
              id="wants"
              name="wants"
              type="number"
              min="1"
              step="0.01"
              value={budgetForm.wants}
              onChange={(event) =>
                setBudgetForm((prev) => ({ ...prev, wants: event.target.value }))
              }
              placeholder="Optional"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="investments" className="text-sm text-white/80">Investments</label>
            <input
              id="investments"
              name="investments"
              type="number"
              min="1"
              step="0.01"
              value={budgetForm.investments}
              onChange={(event) =>
                setBudgetForm((prev) => ({ ...prev, investments: event.target.value }))
              }
              placeholder="Optional"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <Button type="submit" disabled={saving}>Update budget</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
