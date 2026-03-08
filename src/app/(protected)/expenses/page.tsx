import Link from "next/link";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  deleteExpense,
  getExpenses,
  getExpensesByCategory,
} from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { PlusIcon } from "@/components/icons";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "INR",
  });
}

export default async function ExpensesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly category?: string;
    readonly q?: string;
    readonly page?: string;
  }>;
}) {
  const params = await searchParams;
  const category = params.category || "All";
  const query = params.q || "";
  const requestedPage = Number(params.page || "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const pageSize = 20;
  const cookieHeader = (await cookies()).toString();
  const categories = await getCategories(cookieHeader);

  let expenses = [] as Awaited<ReturnType<typeof getExpenses>>;
  let error: string | null = null;

  try {
    expenses =
      category === "All"
        ? await getExpenses(cookieHeader)
        : await getExpensesByCategory(category, cookieHeader);
  } catch (err) {
    error = (err as Error).message;
  }

  const filtered = query
    ? expenses.filter((expense) =>
        expense.name.toLowerCase().includes(query.toLowerCase())
      )
    : expenses;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const paginatedExpenses = filtered.slice(pageStart, pageStart + pageSize);

  const buildPageHref = (page: number) => {
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("q", query);
    if (category !== "All") queryParams.set("category", category);
    if (page > 1) queryParams.set("page", String(page));
    const queryString = queryParams.toString();
    return queryString ? `/expenses?${queryString}` : "/expenses";
  };

  async function handleDelete(formData: FormData) {
    "use server";

    const id = formData.get("id") as string;
    const serverCookieHeader = (await cookies()).toString();
    await deleteExpense(id, serverCookieHeader);
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">Expenses</p>
          <h1 className="text-3xl font-semibold">All expenses</h1>
        </div>
        <Link href="/expenses/new">
          <Button>
            <PlusIcon />
            Add expense
          </Button>
        </Link>
      </div>

      <Card className="space-y-4">
        <form className="grid gap-4 md:grid-cols-[1.1fr_0.4fr]">
          <Input name="q" placeholder="Search by name" defaultValue={query} />
          <Select name="category" defaultValue={category}>
            <option value="All">All categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2">
            <Button type="submit" variant="outline">
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-[var(--accent-3)]/40 bg-[rgba(255,0,153,0.1)] px-4 py-3 text-sm text-white">
          {error}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Try adjusting the filters or add a new expense."
          actionLabel="Add expense"
          actionHref="/expenses/new"
        />
      ) : (
        <div className="grid gap-4">
          {paginatedExpenses.map((expense) => (
            <Card key={expense._id} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="sm:min-w-[200px]">
                <div className="text-sm font-semibold">{expense.name}</div>
                <div className="text-xs text-white/60">
                  {new Date(expense.date).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{expense.category}</Badge>
                <Badge className="text-white/65">{expense.budgetType}</Badge>
              </div>
              <div className="text-sm font-semibold sm:ml-auto">{formatCurrency(expense.amount)}</div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/expenses/${expense._id}`}>
                  <Button variant="outline">Details</Button>
                </Link>
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={expense._id} />
                  <Button type="submit" variant="ghost">
                    Delete
                  </Button>
                </form>
              </div>
            </Card>
          ))}
          {totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2">
              {safeCurrentPage === 1 ? (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              ) : (
                <Link href={buildPageHref(safeCurrentPage - 1)}>
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="text-sm text-white/60">
                Page {safeCurrentPage} of {totalPages}
              </span>
              {safeCurrentPage === totalPages ? (
                <Button variant="outline" disabled>
                  Next
                </Button>
              ) : (
                <Link href={buildPageHref(safeCurrentPage + 1)}>
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
