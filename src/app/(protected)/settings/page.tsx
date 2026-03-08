import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser, updateCurrentUser } from "@/lib/user.api";
import { createCategory, deleteCategory, getCategories } from "@/lib/category.api";
import { getBudgetStatus, updateBudget } from "@/lib/budget.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const cookieHeader = (await cookies()).toString();
  const [user, categories, budgetStatus] = await Promise.all([
    getCurrentUser(cookieHeader),
    getCategories(cookieHeader),
    getBudgetStatus(cookieHeader),
  ]);

  async function handleUpdate(formData: FormData) {
    "use server";

    const payload = {
      name: formData.get("name") ? (formData.get("name") as string).trim() || undefined : undefined,
      email: formData.get("email") ? (formData.get("email") as string).trim() || undefined : undefined,
      password: formData.get("password") ? (formData.get("password") as string).trim() || undefined : undefined,
    };

    const serverCookieHeader = (await cookies()).toString();
    await updateCurrentUser(payload, serverCookieHeader);
    revalidatePath("/settings");
    revalidatePath("/profile");
  }

  async function handleAddCategory(formData: FormData) {
    "use server";

    const name = String(formData.get("name") || "").trim();
    const budgetTypeValue = String(formData.get("budgetType") || "").trim();

    if (
      budgetTypeValue !== "needs" &&
      budgetTypeValue !== "wants" &&
      budgetTypeValue !== "investments"
    ) {
      return;
    }

    if (!name) return;

    const serverCookieHeader = (await cookies()).toString();
    await createCategory(name, budgetTypeValue, serverCookieHeader);
    revalidatePath("/settings");
    revalidatePath("/expenses");
    revalidatePath("/expenses/new");
  }

  async function handleDeleteCategory(formData: FormData) {
    "use server";

    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    const serverCookieHeader = (await cookies()).toString();
    await deleteCategory(id, serverCookieHeader);
    revalidatePath("/settings");
    revalidatePath("/expenses");
    revalidatePath("/expenses/new");
  }

  async function handleUpdateBudget(formData: FormData) {
    "use server";

    const parseValue = (value: FormDataEntryValue | null) => {
      if (typeof value !== "string" || value.trim() === "") return undefined;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : undefined;
    };

    const payload = {
      needs: parseValue(formData.get("needs")),
      wants: parseValue(formData.get("wants")),
      investments: parseValue(formData.get("investments")),
    };

    if (
      payload.needs === undefined &&
      payload.wants === undefined &&
      payload.investments === undefined
    ) {
      return;
    }

    const serverCookieHeader = (await cookies()).toString();
    await updateBudget(payload, serverCookieHeader);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }

  const activeBudgetStatus =
    "month" in budgetStatus ? budgetStatus : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Settings</p>
        <h1 className="text-3xl font-semibold">Account settings</h1>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Update details</h2>
        <form action={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm text-white/80">Name</label>
            <input
              id="name"
              name="name"
              defaultValue={user.name}
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-white/80">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-white/80">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Leave blank to keep current"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Manage categories</h2>
        <form action={handleAddCategory} className="grid gap-3 sm:grid-cols-[1fr_200px_auto] mb-4">
          <input
            name="name"
            placeholder="Add new category"
            className="h-11 flex-1 rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
          />
          <select
            name="budgetType"
            defaultValue="needs"
            className="h-11 rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
          >
            <option value="needs">Needs</option>
            <option value="wants">Wants</option>
            <option value="investments">Investments</option>
          </select>
          <Button type="submit">Add category</Button>
        </form>

        {categories.length === 0 ? (
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
                    <span className="text-xs rounded-full border border-white/15 px-2 py-0.5 text-white/60">
                      {category.budgetType}
                    </span>
                  </div>
                  <form action={handleDeleteCategory}>
                    <input type="hidden" name="id" value={category._id} />
                    <Button type="submit" variant="ghost">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Budget buckets</h2>
        <form action={handleUpdateBudget} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="needs" className="text-sm text-white/80">Needs</label>
            <input
              id="needs"
              name="needs"
              type="number"
              min="1"
              step="0.01"
              defaultValue={activeBudgetStatus?.needs?.budget ?? ""}
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
              defaultValue={activeBudgetStatus?.wants?.budget ?? ""}
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
              defaultValue={activeBudgetStatus?.investments?.budget ?? ""}
              placeholder="Optional"
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <Button type="submit">Update budget</Button>
          </div>
        </form>

      </Card>
    </div>
  );
}
