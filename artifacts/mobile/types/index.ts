export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  repeatType: "none" | "monthly" | "yearly";
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  allocated: number;
}

export interface Deposit {
  id: string;
  amount: number;
  note: string;
  date: string;
}

export interface BudgetData {
  name: string;
  budget: number;
  savingsGoal: number;
  month: string;
  expenses: Expense[];
  deposits: Deposit[];
  reminders: Reminder[];
  categories: BudgetCategory[];
  currency: string;
  currencySymbol: string;
  onboarded: boolean;
}

