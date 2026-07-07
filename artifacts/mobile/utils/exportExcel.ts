import { Platform } from "react-native";
import * as XLSX from "xlsx";
import type { Expense } from "@/types";

export const exportToExcel = async (
  expenses: Expense[],
  budget: number,
  month: string
): Promise<void> => {
  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));

  const rows = monthExpenses.map((e) => ({
    Date: e.date,
    Category: e.category,
    Description: e.description || "-",
    Amount: `Rs. ${e.amount.toLocaleString("en-PK")}`,
  }));

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);

  rows.push(
    {} as (typeof rows)[0],
    {
      Date: "Total Budget",
      Category: `Rs. ${budget.toLocaleString("en-PK")}`,
      Description: "",
      Amount: "",
    },
    {
      Date: "Total Spent",
      Category: `Rs. ${totalSpent.toLocaleString("en-PK")}`,
      Description: "",
      Amount: "",
    },
    {
      Date: "Remaining",
      Category: `Rs. ${(budget - totalSpent).toLocaleString("en-PK")}`,
      Description: "",
      Amount: "",
    }
  );

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${month} Statement`);
  const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

  if (Platform.OS === "web") {
    const byteChars = atob(wbout);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNums)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Statement_${month}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");

  const uri =
    (FileSystem as any).documentDirectory + `Statement_${month}.xlsx`;
  await (FileSystem as any).writeAsStringAsync(uri, wbout, {
    encoding: "base64",
  });
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri);
  }
};
