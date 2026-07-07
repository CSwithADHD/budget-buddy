import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useBudget } from "@/context/BudgetContext";
import { getCurrentMonth } from "@/utils/calculations";
import { Colors } from "@/constants/colors";
import type { BudgetCategory } from "@/types";

const COLORS = [
  "#EC4899", "#F59E0B", "#3B82F6", "#06B6D4",
  "#8B5CF6", "#F97316", "#EF4444", "#A855F7",
];

const ICONS = [
  "shopping-bag", "book-open", "coffee", "heart",
  "truck", "activity", "gift", "smile",
];

export default function InsightsScreen() {
  const { data, setBudget } = useBudget();
  const insets = useSafeAreaInsets();

  const currentMonth = getCurrentMonth();

  const availableMonths = React.useMemo(() => {
    const set = new Set<string>(data.expenses.map((e) => e.date.slice(0, 7)));
    set.add(currentMonth);
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [data.expenses, currentMonth]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const selectedMonthLabel = React.useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }, [selectedMonth]);

  const cycleMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    setSelectedMonth(availableMonths[(idx + 1) % availableMonths.length]);
  };

  const monthExpenses = data.expenses.filter((e) => e.date.startsWith(selectedMonth));
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const remaining = Math.max(0, data.budget - totalSpent);

  // Gauge math
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const activeArcLength = (240 / 360) * circumference;
  const progressRatio = data.budget > 0 ? Math.min(totalSpent / data.budget, 1) : 0;
  const progressArcLength = progressRatio * activeArcLength;
  const gaugeColor = progressRatio >= 1 ? Colors.accentNegative : progressRatio >= 0.75 ? "#C9A010" : Colors.accentPositive;

  const categoryStats = data.categories.map((cat) => {
    const catExpenses = monthExpenses.filter(
      (e) => e.category.toLowerCase() === cat.name.toLowerCase()
    );
    const spent = catExpenses.reduce((s, e) => s + e.amount, 0);
    const percent = cat.allocated > 0 ? Math.min((spent / cat.allocated) * 100, 100) : 0;
    const percentOfTotal = totalSpent > 0 ? (spent / totalSpent * 100) : 0;
    return { ...cat, spent, count: catExpenses.length, percent, percentOfTotal };
  });

  // Calculate expense per day
  const daysInMonth = new Date(Number(selectedMonth.split("-")[0]), Number(selectedMonth.split("-")[1]), 0).getDate();
  const expensePerDay = totalSpent > 0 ? (totalSpent / daysInMonth).toFixed(2) : "0.00";

  // Find highest and lowest expense categories
  const highestCategory = categoryStats.reduce((max, cat) => cat.spent > max.spent ? cat : max, categoryStats[0] || null);
  const lowestCategory = categoryStats.filter(c => c.spent > 0).reduce((min, cat) => cat.spent < min.spent ? cat : min, categoryStats.filter(c => c.spent > 0)[0] || null);

  const [adjustVisible, setAdjustVisible] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState(data.budget.toString());
  const [editCategories, setEditCategories] = useState<BudgetCategory[]>(data.categories);
  const [newCatVisible, setNewCatVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);
  const [newCatError, setNewCatError] = useState("");

  const unallocated =
    (parseFloat(totalBudgetInput) || 0) -
    editCategories.reduce((s, c) => s + c.allocated, 0);

  const handleOpenAdjust = () => {
    setTotalBudgetInput(data.budget.toString());
    setEditCategories(data.categories);
    setAdjustVisible(true);
  };

  const handleSaveAdjust = async () => {
    const budgetVal = parseFloat(totalBudgetInput) || 0;
    if (budgetVal <= 0) { alert("Please enter a valid budget amount"); return; }
    if (unallocated < 0) { alert("Allocated amounts exceed total budget!"); return; }
    await setBudget(budgetVal, data.savingsGoal, editCategories);
    setAdjustVisible(false);
  };

  const handleSaveNewCat = () => {
    if (!newCatName.trim()) { setNewCatError("Category name is required"); return; }
    if (editCategories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      setNewCatError("Category already exists"); return;
    }
    setEditCategories((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newCatName.trim(), icon: newCatIcon, color: newCatColor, allocated: 0 },
    ]);
    setNewCatName(""); setNewCatError(""); setNewCatVisible(false);
  };

  const topPad = Platform.OS === "web" ? 32 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={[styles.root, { paddingTop: topPad + 16 }]}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Insights</Text>
        <TouchableOpacity style={styles.monthPill} onPress={cycleMonth} activeOpacity={0.7}>
          <Text style={styles.monthPillText}>{selectedMonthLabel}</Text>
          <Feather name="chevron-down" size={13} color={Colors.textTertiary} style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.cardLabel}>Monthly budget</Text>
              <Text style={styles.cardAmount}>
                {data.currencySymbol}{(data.budget || 0).toLocaleString("en-US")}
              </Text>
            </View>
            <TouchableOpacity style={styles.adjustBtn} onPress={handleOpenAdjust} activeOpacity={0.8}>
              <Text style={styles.adjustBtnText}>Adjust</Text>
              <Feather name="edit-2" size={12} color={Colors.accent} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Circular gauge */}
          <View style={styles.gaugeWrap}>
            <Svg width={180} height={150}>
              <Circle
                cx="90" cy="80" r={radius}
                stroke={Colors.border} strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={`${activeArcLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(150 90 80)"
              />
              {progressArcLength > 0 && (
                <Circle
                  cx="90" cy="80" r={radius}
                  stroke={gaugeColor} strokeWidth={strokeWidth} fill="transparent"
                  strokeDasharray={`${progressArcLength} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(150 90 80)"
                />
              )}
            </Svg>
            <View style={styles.gaugeOverlay}>
              <Text style={styles.gaugeValue}>
                {data.currencySymbol}{totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.gaugeLabel}>Spent</Text>
            </View>
          </View>

          <View style={styles.remainingBadge}>
            <Text style={styles.remainingText}>
              Left to spend:{" "}
              <Text style={styles.remainingBold}>
                {data.currencySymbol}{remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Text>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          {/* Expense Per Day */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Feather name="calendar" size={16} color={Colors.accent} />
              <Text style={styles.statLabel}>Expense Per Day</Text>
            </View>
            <Text style={styles.statValue}>
              {data.currencySymbol}{expensePerDay}
            </Text>
          </View>

          {/* Highest Expense */}
          {highestCategory && highestCategory.spent > 0 && (
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Feather name="trending-up" size={16} color={Colors.accentNegative} />
                <Text style={styles.statLabel}>Highest Spending</Text>
              </View>
              <View style={styles.categoryBadge}>
                <View style={[styles.catBadgeIcon, { backgroundColor: highestCategory.color + "20" }]}>
                  <Feather name={highestCategory.icon as any} size={14} color={highestCategory.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catBadgeName}>{highestCategory.name}</Text>
                  <Text style={styles.catBadgeAmount}>
                    {data.currencySymbol}{highestCategory.spent.toLocaleString("en-US")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Lowest Expense */}
          {lowestCategory && lowestCategory.spent > 0 && (
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Feather name="trending-down" size={16} color={Colors.accentPositive} />
                <Text style={styles.statLabel}>Lowest Spending</Text>
              </View>
              <View style={styles.categoryBadge}>
                <View style={[styles.catBadgeIcon, { backgroundColor: lowestCategory.color + "20" }]}>
                  <Feather name={lowestCategory.icon as any} size={14} color={lowestCategory.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catBadgeName}>{lowestCategory.name}</Text>
                  <Text style={styles.catBadgeAmount}>
                    {data.currencySymbol}{lowestCategory.spent.toLocaleString("en-US")}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Budget category</Text>

        {categoryStats.length === 0 && (
          <View style={styles.emptyCategories}>
            <Feather name="tag" size={32} color={Colors.border} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No categories yet</Text>
            <Text style={styles.emptySubText}>Tap Adjust above to add categories</Text>
          </View>
        )}

        {categoryStats.map((cat) => (
          <View key={cat.id} style={styles.catRow}>
            <View style={styles.catLeft}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}>
                <Feather name={cat.icon as any} size={18} color={cat.color} />
              </View>
              <View>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catCount}>
                  {cat.count} transaction{cat.count !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <View style={styles.catRight}>
              <View style={styles.catTopRow}>
                <Text style={styles.catFraction}>
                  <Text style={styles.catSpent}>{data.currencySymbol}{cat.spent.toLocaleString("en-US")}</Text>
                  <Text style={styles.catAlloc}> / {data.currencySymbol}{cat.allocated.toLocaleString("en-US")}</Text>
                </Text>
                <Text style={styles.catPercentage}>{cat.percentOfTotal.toFixed(1)}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { backgroundColor: cat.color, width: `${cat.percent}%` as any }]} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Adjust modal */}
      <Modal visible={adjustVisible} transparent animationType="slide" onRequestClose={() => setAdjustVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Budget & Categories</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setAdjustVisible(false)} activeOpacity={0.7}>
                <Feather name="x" size={20} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Total Monthly Budget ({data.currency})</Text>
                <View style={styles.budgetInputWrap}>
                  <Text style={styles.dollarSign}>{data.currencySymbol}</Text>
                  <TextInput
                    style={styles.budgetInput}
                    value={totalBudgetInput}
                    onChangeText={setTotalBudgetInput}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                <Text style={styles.sectionLabel}>Category Allocations</Text>
                <View style={styles.catList}>
                  {editCategories.map((cat) => (
                    <View key={cat.id} style={styles.catEditRow}>
                      <View style={styles.catEditLeft}>
                        <View style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}>
                          <Feather name={cat.icon as any} size={16} color={cat.color} />
                        </View>
                        <Text style={styles.catEditName}>{cat.name}</Text>
                      </View>
                      <View style={styles.catInputWrap}>
                        <Text style={styles.dollarSign}>{data.currencySymbol}</Text>
                        <TextInput
                          style={styles.catInput}
                          value={cat.allocated.toString()}
                          onChangeText={(v) =>
                            setEditCategories((prev) =>
                              prev.map((c) => c.id === cat.id ? { ...c, allocated: parseFloat(v) || 0 } : c)
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addCatRow} onPress={() => setNewCatVisible(true)}>
                    <Feather name="plus" size={16} color={Colors.accent} style={{ marginRight: 8 }} />
                    <Text style={styles.addCatText}>Add new category</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.unallocatedRow}>
                  <Text style={styles.unallocatedLabel}>Unallocated:</Text>
                  <Text style={[styles.unallocatedVal, { color: unallocated < 0 ? Colors.accentNegative : Colors.accentPositive }]}>
                    {data.currencySymbol}{unallocated.toLocaleString("en-US")}
                  </Text>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAdjust} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>Save changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>

        {/* Nested: new category modal */}
        <Modal visible={newCatVisible} transparent animationType="slide" onRequestClose={() => setNewCatVisible(false)}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add new category</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setNewCatVisible(false)} activeOpacity={0.7}>
                  <Feather name="x" size={18} color={Colors.accentNegative} />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>Category name</Text>
              <TextInput
                style={styles.textInput}
                value={newCatName}
                onChangeText={(t) => { setNewCatName(t); if (newCatError) setNewCatError(""); }}
                placeholder="e.g. Shopping"
                placeholderTextColor={Colors.textTertiary}
              />
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorRow}>
                {COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[styles.colorDot, { backgroundColor: col }, newCatColor === col && { borderWidth: 3, borderColor: col, opacity: 1 }]}
                    onPress={() => setNewCatColor(col)}
                  />
                ))}
              </View>
              <Text style={styles.inputLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconOption, newCatIcon === ic && styles.iconOptionSelected]}
                    onPress={() => setNewCatIcon(ic)}
                  >
                    <Feather name={ic as any} size={18} color={newCatIcon === ic ? Colors.accent : Colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {!!newCatError && <Text style={styles.errorText}>{newCatError}</Text>}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveNewCat} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  monthPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  monthPillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  scroll: { paddingHorizontal: 20 },

  // Overview card
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    marginBottom: 28,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardAmount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  adjustBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent + "18",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  adjustBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
  gaugeWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    position: "relative",
  },
  gaugeOverlay: {
    position: "absolute",
    alignItems: "center",
    top: 50,
  },
  gaugeValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 2,
    fontVariant: ["tabular-nums"],
  },
  gaugeLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  remainingBadge: {
    alignItems: "center",
    marginTop: 8,
  },
  remainingText: {
    backgroundColor: Colors.accentPositive + "15",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.accentPositive,
    overflow: "hidden",
  },
  remainingBold: {
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },

  // Categories
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  emptyCategories: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catLeft: { flexDirection: "row", alignItems: "center", flex: 1.1 },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  catName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  catCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  catRight: { alignItems: "flex-end", flex: 0.9 },
  catFraction: { fontSize: 12, marginBottom: 8 },
  catSpent: { fontFamily: "Inter_700Bold", color: Colors.textPrimary, fontVariant: ["tabular-nums"] as any },
  catAlloc: { fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  barTrack: {
    height: 4,
    width: 110,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 2 },

  // Statistics Section
  statsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  catBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catBadgeName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  catBadgeAmount: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    fontVariant: ["tabular-nums"],
  },
  catTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catPercentage: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
    backgroundColor: Colors.accent + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontVariant: ["tabular-nums"],
  },

  // Modals
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accent + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  budgetInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  budgetInput: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 4,
  },
  catList: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  catEditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catEditLeft: { flexDirection: "row", alignItems: "center" },
  catEditName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  catInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 80,
  },
  dollarSign: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    marginRight: 2,
  },
  catInput: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    flex: 1,
    padding: 0,
    textAlign: "right",
  },
  addCatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  addCatText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
  unallocatedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  unallocatedLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  unallocatedVal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  iconOption: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconOptionSelected: {
    backgroundColor: Colors.accent + "18",
    borderColor: Colors.accent,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.accentNegative,
    marginBottom: 8,
  },
});
