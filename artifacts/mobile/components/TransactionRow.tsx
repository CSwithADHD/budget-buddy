import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useBudget } from "@/context/BudgetContext";
import { Colors } from "@/constants/colors";
import type { Expense } from "@/types";

interface Props {
  expense: Expense;
  onDelete: (id: string) => void;
}

export default function TransactionRow({ expense, onDelete }: Props) {
  const { data } = useBudget();

  const cat = data.categories.find(
    (c) => c.name.toLowerCase() === expense.category.toLowerCase()
  );

  const descLower = (expense.description || "").toLowerCase();
  const catLower = expense.category.toLowerCase();

  let isFLogo = false;
  let iconName: any = "dollar-sign";
  let iconColor = Colors.textTertiary;
  let iconBg = "rgba(255,255,255,0.06)";

  if (descLower.includes("fitness first") || catLower.includes("fitness")) {
    isFLogo = true;
    iconBg = "#D3122A";
  } else if (
    descLower.includes("transfer wise") ||
    descLower.includes("wise") ||
    catLower.includes("wise")
  ) {
    iconName = "arrow-up-right";
    iconColor = Colors.accentPositive;
    iconBg = Colors.accentPositive + "20";
  } else if (cat) {
    iconName = cat.icon;
    iconColor = cat.color;
    iconBg = cat.color + "20";
  }

  const isIncome =
    descLower.includes("deposit") ||
    descLower.includes("wise") ||
    descLower.includes("income") ||
    expense.amount < 0;

  const displayAmount = isIncome
    ? `+${data.currencySymbol}${Math.abs(expense.amount).toFixed(2)}`
    : `-${data.currencySymbol}${Math.abs(expense.amount).toFixed(2)}`;

  const amountColor = isIncome ? Colors.accentPositive : Colors.accentNegative;

  const handleLongPress = () => {
    Alert.alert(
      "Delete Transaction",
      `Delete "${expense.description || expense.category}" for ${data.currencySymbol}${Math.abs(expense.amount).toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(expense.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {isFLogo ? (
          <Text style={styles.fLogoText}>F</Text>
        ) : (
          <Feather name={iconName} size={18} color={iconColor} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description || expense.category}
        </Text>
        <Text style={styles.category}>{expense.category}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>{displayAmount}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  fLogoText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
});
