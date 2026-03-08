import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createExpense, reccuringCharge } from "@/lib/expense.api";
import { getCategories } from "@/lib/category.api";
import { Card } from "@/components/ui/card";
import { NewExpenseForm } from "@/components/app/NewExpenseForm";

async function handleCreate(formData: FormData) {
  "use server";

  const isRecurring = formData.get("isRecurring") === "on";

  const payload = {
    name: (formData.get("name") as string) || "",
    amount: Number(formData.get("amount") || 0),
    category: (formData.get("category") as string) || "",
    date: (formData.get("date") as string) || "",
    description: (formData.get("description") as string) || "",
  };

  const cookieHeader = (await cookies()).toString();

  if (isRecurring) {
    const endDateValue = formData.get("endDate");
    const endDate =
      typeof endDateValue === "string" && endDateValue.trim().length > 0
        ? endDateValue
        : undefined;

    await reccuringCharge(
      {
        ...payload,
        frequency: (formData.get("frequency") as string) || "",
        interval: Number(formData.get("interval") || 1),
        startDate: (formData.get("startDate") as string) || "",
        endDate,
      },
      cookieHeader
    );
  } else {
    await createExpense(payload, cookieHeader);
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect("/expenses");
}

export default async function NewExpensePage() {
  const cookieHeader = (await cookies()).toString();
  const categories = await getCategories(cookieHeader);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60">Expenses</p>
        <h1 className="text-3xl font-semibold">Add a new expense</h1>
      </div>
      <Card>
        <NewExpenseForm action={handleCreate} today={today} categories={categories} />
      </Card>
    </div>
  );
}
