import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Params = { id: string };

export default async function ExpenseDetailPage({
  params,
}: {
  readonly params: Promise<Params>;
}) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();
  const categories = await getCategories(cookieHeader);

  let expense;
  try {
    expense = await getExpenseById(id, cookieHeader);
  } catch {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        Expense not found.
      </div>
    );
  }

  async function handleUpdate(formData: FormData) {
    "use server";

    const expenseId = formData.get("id");
    if (typeof expenseId !== "string") return;
    
    const payload = {
      name: formData.get("name") as string | undefined,
      amount: Number(formData.get("amount") || 0),
      category: formData.get("category") as string | undefined,
      date: formData.get("date") as string | undefined,
      description: formData.get("description") as string | undefined,
    };

    const serverCookieHeader = (await cookies()).toString();
    await updateExpense(expenseId, payload, serverCookieHeader);
    revalidatePath(`/expenses/${expenseId}`);
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
  }

  async function handleDelete(formData: FormData) {
    "use server";

    const expenseId = formData.get("id");
    if (typeof expenseId !== "string") return;
    
    const serverCookieHeader = (await cookies()).toString();
    await deleteExpense(expenseId, serverCookieHeader);
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    redirect("/expenses");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Expense details</p>
          <h1 className="text-3xl font-semibold">{expense.name}</h1>
        </div>
      </div>

      <Card>
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{expense.category}</Badge>
            <Badge className="text-white/65">{expense.budgetType}</Badge>
            <span className="text-white/60 text-sm">
              {new Date(expense.date).toLocaleDateString()}
            </span>
          </div>
          <div className="text-3xl font-semibold">
            {expense.amount.toLocaleString("en-US", {
              style: "currency",
              currency: "INR",
            })}
          </div>
        </div>

        <form action={handleUpdate} className="space-y-5">
          <input type="hidden" name="id" value={expense._id} />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-white/80">Expense name</label>
              <input
                id="name"
                name="name"
                defaultValue={expense.name}
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm text-white/80">Amount</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="0.01"
                defaultValue={expense.amount}
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm text-white/80">Category</label>
              <select
                id="category"
                name="category"
                defaultValue={expense.categoryId || ""}
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm text-white/80">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date(expense.date).toISOString().slice(0, 10)}
                required
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm text-white/80">Description</label>
            <textarea
              id="description"
              name="description"
              defaultValue={expense.description || ""}
              className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-sm text-white focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
        <form action={handleDelete} className="mt-3">
          <input type="hidden" name="id" value={expense._id} />
          <Button type="submit" variant="ghost">Delete</Button>
        </form>
      </Card>
    </div>
  );
}
