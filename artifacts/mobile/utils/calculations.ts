import type { Expense } from "@/types";

export const getCurrentMonth = (): string =>
  new Date().toISOString().slice(0, 7);

export const getTotalSpent = (expenses: Expense[], month: string): number =>
  expenses
    .filter((e) => e.date.startsWith(month))
    .reduce((sum, e) => sum + e.amount, 0);

export const getRemainingBalance = (
  budget: number,
  totalSpent: number
): number => budget - totalSpent;

export const getSavingsProgress = (
  remainingBalance: number,
  savingsGoal: number
): number =>
  savingsGoal > 0 ? Math.min((remainingBalance / savingsGoal) * 100, 100) : 0;

export const formatRs = (n: number): string =>
  `Rs. ${Math.abs(n).toLocaleString("en-PK")}`;

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateShort = (dateStr: string): string => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
};
