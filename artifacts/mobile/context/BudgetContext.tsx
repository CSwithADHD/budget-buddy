import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getData, saveData, generateId } from "@/utils/storage";
import type { BudgetData, Deposit, Expense, Reminder, BudgetCategory } from "@/types";

interface BudgetContextType {
  data: BudgetData;
  loading: boolean;
  refresh: () => Promise<void>;
  completeOnboarding: (name: string, budget: number, savingsGoal: number, categories: BudgetCategory[], currency: string, currencySymbol: string) => Promise<void>;
  setBudget: (budget: number, savingsGoal: number, categories: BudgetCategory[]) => Promise<void>;
  updateCategories: (categories: BudgetCategory[]) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addDeposit: (deposit: Omit<Deposit, "id">) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, "id">) => Promise<void>;
  updateReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: "1", name: "General", icon: "pie-chart", color: "#A855F7", allocated: 1000 },
  { id: "2", name: "Transportation", icon: "truck", color: "#3B82F6", allocated: 1000 },
  { id: "3", name: "Charity", icon: "heart", color: "#F43F5E", allocated: 1000 },
];

const EMPTY: BudgetData = {
  name: "",
  budget: 0,
  savingsGoal: 0,
  month: new Date().toISOString().slice(0, 7),
  expenses: [],
  deposits: [],
  reminders: [],
  categories: DEFAULT_CATEGORIES,
  currency: "USD",
  currencySymbol: "$",
  onboarded: false,
};

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BudgetData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const d = await getData();
    // Safely migrate categories if they don't exist
    if (!d.categories || d.categories.length === 0) {
      d.categories = DEFAULT_CATEGORIES;
    }
    // Safely migrate deposits field for existing stored data
    if (!d.deposits) {
      d.deposits = [];
    }
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const completeOnboarding = useCallback(
    async (name: string, budget: number, savingsGoal: number, categories: BudgetCategory[], currency: string, currencySymbol: string) => {
      const next: BudgetData = {
        ...data,
        name,
        budget,
        savingsGoal,
        categories,
        currency,
        currencySymbol,
        onboarded: true,
      };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const setBudget = useCallback(
    async (budget: number, savingsGoal: number, categories: BudgetCategory[]) => {
      const next = { ...data, budget, savingsGoal, categories };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const updateCategories = useCallback(
    async (categories: BudgetCategory[]) => {
      const next = { ...data, categories };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const addExpense = useCallback(
    async (expense: Omit<Expense, "id">) => {
      const newExpense: Expense = { ...expense, id: generateId() };
      const next = { ...data, expenses: [...data.expenses, newExpense] };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const next = {
        ...data,
        expenses: data.expenses.filter((e) => e.id !== id),
      };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const addDeposit = useCallback(
    async (deposit: Omit<Deposit, "id">) => {
      const newDeposit: Deposit = { ...deposit, id: generateId() };
      const next = { ...data, deposits: [...(data.deposits ?? []), newDeposit] };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const addReminder = useCallback(
    async (reminder: Omit<Reminder, "id">) => {
      const newReminder: Reminder = { ...reminder, id: generateId() };
      const next = { ...data, reminders: [...data.reminders, newReminder] };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const updateReminder = useCallback(
    async (reminder: Reminder) => {
      const next = {
        ...data,
        reminders: data.reminders.map((r) =>
          r.id === reminder.id ? reminder : r
        ),
      };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      const next = {
        ...data,
        reminders: data.reminders.filter((r) => r.id !== id),
      };
      setData(next);
      await saveData(next);
    },
    [data]
  );

  return (
    <BudgetContext.Provider
      value={{
        data,
        loading,
        refresh,
        completeOnboarding,
        setBudget,
        updateCategories,
        addExpense,
        deleteExpense,
        addDeposit,
        addReminder,
        updateReminder,
        deleteReminder,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): BudgetContextType {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
  return ctx;
}

