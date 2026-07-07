import React, { useCallback } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import BalanceCard from "@/components/BalanceCard";
import SpendingChart from "@/components/SpendingChart";
import TransactionRow from "@/components/TransactionRow";
import { useBudget } from "@/context/BudgetContext";
import { getCurrentMonth, getTotalSpent } from "@/utils/calculations";
import { Colors } from "@/constants/colors";

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const first = (name || "there").split(" ")[0];
  if (hour < 12) return `Good Morning, ${first}`;
  if (hour < 17) return `Good Afternoon, ${first}`;
  return `Good Evening, ${first}`;
}

export default function DashboardScreen() {
  const { data, loading, refresh, deleteExpense } = useBudget();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentMonth = getCurrentMonth();
  const totalSpent = getTotalSpent(data.expenses, currentMonth);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const recentExpenses = [...data.expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const topPad = Platform.OS === "web" ? 32 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: topPad + 16 }]}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/avatar_parzival.png")}
              style={styles.profileAvatar}
            />
            <View>
              <Text style={styles.greeting}>{getGreeting(data.name)}</Text>
              <Text style={styles.greetingSubtitle}>Have a good day!</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push("/(tabs)/reminders" as any)}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color={Colors.textPrimary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* ── Balance Card ──────────────────────────────────────── */}
        <BalanceCard spent={totalSpent} />

        {/* ── Trend Chart ───────────────────────────────────────── */}
        <SpendingChart />

        {/* ── Transactions ──────────────────────────────────────── */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/statement" as any)}
              style={styles.viewAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>view all</Text>
              <Feather name="chevron-right" size={14} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {recentExpenses.length > 0 ? (
            <View style={styles.transactionsList}>
              {recentExpenses.map((e) => (
                <TransactionRow key={e.id} expense={e} onDelete={deleteExpense} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={36} color={Colors.border} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubText}>
                Tap the Add tab below to log your first expense
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 0 },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  greeting: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 1,
  },
  greetingSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accentNegative,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  // Transactions
  recentSection: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
    marginRight: 2,
  },
  transactionsList: {
    marginBottom: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
