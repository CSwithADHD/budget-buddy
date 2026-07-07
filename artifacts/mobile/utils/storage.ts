import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BudgetData } from "@/types";

const STORAGE_KEY = "budgetDataV2";

const EMPTY_DATA: BudgetData = {
  name: "",
  budget: 0,
  savingsGoal: 0,
  month: new Date().toISOString().slice(0, 7),
  expenses: [],
  deposits: [],
  reminders: [],
  categories: [],
  currency: "USD",
  currencySymbol: "$",
  onboarded: false,
};

export const getData = async (): Promise<BudgetData> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as BudgetData;
    return {
      ...EMPTY_DATA,
      ...parsed,
    };
  } catch {
    return EMPTY_DATA;
  }
};

export const saveData = async (data: BudgetData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);
