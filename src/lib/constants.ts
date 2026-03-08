export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const CATEGORIES = [
  "Food",
  "Shopping",
  "Bills and Utilities",
  "Entertainment",
  "Health",
  "Misc",
  "Education",
  "Rent",
  "Transportation",
] as const;
