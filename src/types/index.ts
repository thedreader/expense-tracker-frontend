export type ExpenseCategory = string;

export type Category = {
  _id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  description?: string;
  category: ExpenseCategory;
  categoryId?: string;
  budgetType: "needs" | "wants" | "investments";
  date: string;
};

export type RecurringCharge = {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  description?: string;
  category: ExpenseCategory;
  categoryId?: string;
  budgetType: "needs" | "wants" | "investments";
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  startDate: string;
  endDate?: string | null;
  nextOccurrence: string;
  isActive: boolean;
};

export type User = {
  _id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  message?: string;
  accessToken?: string;
};

export type ApiMessage = {
  message: string;
};

export type BudgetBucketKey = "needs" | "wants" | "investments";

export type BudgetBucketStatus = {
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
};

export type BudgetStatus = {
  month: number;
  year: number;
  needs: BudgetBucketStatus | null;
  wants: BudgetBucketStatus | null;
  investments: BudgetBucketStatus | null;
};
