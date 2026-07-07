import React, { useState } from "react";
import {
  Animated,
  Dimensions,
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useBudget } from "@/context/BudgetContext";
import { getCurrentMonth } from "@/utils/calculations";
import { Colors } from "@/constants/colors";
import type { BudgetCategory } from "@/types";

const { width } = Dimensions.get("window");

const QUICK_AMOUNTS = [100, 200, 500, 1000];

const COLORS = [
  "#EC4899", "#F59E0B", "#3B82F6", "#06B6D4",
  "#8B5CF6", "#F97316", "#EF4444", "#A855F7",
];

const ICONS = [
  "shopping-bag", "book-open", "coffee", "heart",
  "truck", "activity", "gift", "smile",
];

export default function SpendingInsightScreen() {
  const { data, setBudget } = useBudget();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentMonth = getCurrentMonth();

  const availableMonths = React.useMemo(() => {
    const monthSet = new Set<string>(data.expenses.map((e) => e.date.slice(0, 7)));
    monthSet.add(currentMonth);
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [data.expenses, currentMonth]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const selectedMonthLabel = React.useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }, [selectedMonth]);

  const cycleMonth = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    const next = availableMonths[(idx + 1) % availableMonths.length];
    setSelectedMonth(next);
  };

  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [totalBudget, setTotalBudget] = useState(data.budget.toString());
  const [categories, setCategories] = useState<BudgetCategory[]>(data.categories);

  const [newCatModalVisible, setNewCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);
  const [newCatError, setNewCatError] = useState("");

  const currentMonthExpenses = data.expenses.filter((e) => e.date.startsWith(selectedMonth));
  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, data.budget - totalSpent);

  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const activeArcLength = (240 / 360) * circumference;
  const progressRatio = data.budget > 0 ? Math.min(totalSpent / data.budget, 1) : 0;
  const progressArcLength = progressRatio * activeArcLength;
  const gaugeColor = progressRatio >= 1 ? Colors.accentNegative : progressRatio >= 0.75 ? "#C9A010" : Colors.accentPositive;

  const categoryStats = data.categories.map((cat) => {
    const expensesForCat = currentMonthExpenses.filter(
      (e) => e.category.toLowerCase() === cat.name.toLowerCase()
    );
    const spentVal = expensesForCat.reduce((sum, e) => sum + e.amount, 0);
    const percent = cat.allocated > 0 ? Math.min((spentVal / cat.allocated) * 100, 100) : 0;
    return { ...cat, spent: spentVal, count: expensesForCat.length, percent };
  });

  const getSumAllocated = (catList: BudgetCategory[]) => catList.reduce((sum, c) => sum + c.allocated, 0);
  const amountLeftInAdjust = parseFloat(totalBudget) ? parseFloat(totalBudget) - getSumAllocated(categories) : 0;

  const handleOpenAdjust = () => {
    setTotalBudget(data.budget.toString());
    setCategories(data.categories);
    setAdjustModalVisible(true);
  };

  const handleCategoryAllocChange = (id: string, text: string) => {
    const numeric = parseFloat(text) || 0;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, allocated: numeric } : c)));
  };

  const handleSaveAdjustedBudget = async () => {
    const budgetVal = parseFloat(totalBudget) || 0;
    if (budgetVal <= 0) { alert("Please enter a valid budget amount"); return; }
    if (amountLeftInAdjust < 0) { alert("Allocated category budgets exceed your total budget!"); return; }
    await setBudget(budgetVal, data.savingsGoal, categories);
    setAdjustModalVisible(false);
  };

  const handleSaveNewCategory = () => {
    if (!newCatName.trim()) { setNewCatError("Category name is required"); return; }
    const exists = categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (exists) { setNewCatError("Category already exists"); return; }
    const newCat: BudgetCategory = { id: Date.now().toString(), name: newCatName.trim(), icon: newCatIcon, color: newCatColor, allocated: 0 };
    setCategories((prev) => [...prev, newCat]);
    setNewCatModalVisible(false);
  };

  const topPad = Platform.OS === "web" ? 32 : insets.top;
  const bottomPad = Platform.OS === "web" ? 32 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spending insight</Text>
        <TouchableOpacity style={styles.monthDropdown} onPress={cycleMonth} activeOpacity={0.7}>
          <Text style={styles.monthDropdownText}>{selectedMonthLabel}</Text>
          <Feather name="chevron-down" size={14} color={Colors.textTertiary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollGrow} showsVerticalScrollIndicator={false}>
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Monthly budget</Text>
              <Text style={styles.cardAmount}>
                ${(data.budget || 0).toLocaleString("en-US")}
              </Text>
            </View>
            <TouchableOpacity style={styles.adjustLink} onPress={handleOpenAdjust}>
              <Text style={styles.adjustLinkText}>Adjust</Text>
              <Feather name="edit-2" size={12} color={Colors.accent} style={styles.adjustIcon} />
            </TouchableOpacity>
          </View>

          {/* Gauge */}
          <View style={styles.gaugeContainer}>
            <Svg width={180} height={150}>
              <Circle
                cx="90" cy="80" r={radius}
                stroke={Colors.border} strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={`${activeArcLength} ${circumference}`}
                strokeLinecap="round"
                transform={`rotate(150 90 80)`}
              />
              {progressArcLength > 0 && (
                <Circle
                  cx="90" cy="80" r={radius}
                  stroke={gaugeColor} strokeWidth={strokeWidth} fill="transparent"
                  strokeDasharray={`${progressArcLength} ${circumference}`}
                  strokeLinecap="round"
                  transform={`rotate(150 90 80)`}
                />
              )}
            </Svg>
            <View style={styles.gaugeTextOverlay}>
              <Text style={styles.gaugeValueText}>
                ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.gaugeLabelText}>Spent</Text>
            </View>
          </View>

          <View style={styles.leftBadgeContainer}>
            <View style={styles.leftBadge}>
              <Text style={styles.leftBadgeText}>
                Left to spend: <Text style={styles.leftBadgeBold}>${remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Budget category</Text>
          {categoryStats.map((cat) => (
            <View key={cat.id} style={styles.categoryItemRow}>
              <View style={styles.itemRowLeft}>
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + "20" }]}>
                  <Feather name={cat.icon as any} size={18} color={cat.color} />
                </View>
                <View style={styles.categoryMeta}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.transactionCount}>
                    {cat.count} transaction{cat.count !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRowRight}>
                <Text style={styles.spendingFraction}>
                  <Text style={styles.spentBold}>${cat.spent.toLocaleString("en-US")}</Text>
                  <Text style={styles.allocatedLimit}> / ${cat.allocated.toLocaleString("en-US")}</Text>
                </Text>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { backgroundColor: cat.color, width: `${cat.percent}%` as any }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Adjust Modal */}
      <Modal visible={adjustModalVisible} transparent animationType="slide" onRequestClose={() => setAdjustModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Budget & Categories</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAdjustModalVisible(false)} activeOpacity={0.7}>
                <Feather name="x" size={20} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.adjustModalKeyboard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.adjustInputRow}>
                  <Text style={styles.modalFormLabel}>Total Monthly Budget ($)</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    value={totalBudget}
                    onChangeText={setTotalBudget}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                <Text style={styles.modalSectionLabel}>Category Allocations</Text>
                <View style={styles.adjustCategoryList}>
                  {categories.map((cat) => (
                    <View key={cat.id} style={styles.categoryRow}>
                      <View style={styles.categoryRowLeft}>
                        <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + "20" }]}>
                          <Feather name={cat.icon as any} size={16} color={cat.color} />
                        </View>
                        <Text style={styles.categoryNameText}>{cat.name}</Text>
                      </View>
                      <View style={styles.categoryInputContainer}>
                        <Text style={styles.categoryInputDollar}>$</Text>
                        <TextInput
                          style={styles.categoryAllocInput}
                          value={cat.allocated.toString()}
                          onChangeText={(val) => handleCategoryAllocChange(cat.id, val)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addCategoryRow} onPress={() => setNewCatModalVisible(true)}>
                    <Feather name="plus" size={16} color={Colors.accent} style={{ marginRight: 8 }} />
                    <Text style={styles.addCategoryText}>Add new category</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.amountLeftRow}>
                  <Text style={styles.amountLeftLabel}>Unallocated amount left:</Text>
                  <Text style={[styles.amountLeftValText, { color: amountLeftInAdjust < 0 ? Colors.accentNegative : Colors.accentPositive }]}>
                    ${amountLeftInAdjust.toLocaleString("en-US")}
                  </Text>
                </View>
                <TouchableOpacity style={styles.primaryBtnLarge} onPress={handleSaveAdjustedBudget} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnLargeText}>Save changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>

        {/* New category modal */}
        <Modal visible={newCatModalVisible} transparent animationType="slide" onRequestClose={() => setNewCatModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add new category</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setNewCatModalVisible(false)} activeOpacity={0.7}>
                  <Feather name="x" size={18} color={Colors.accentNegative} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalFormLabel}>Category name</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newCatName}
                  onChangeText={(t) => { setNewCatName(t); if (newCatError) setNewCatError(""); }}
                  placeholder="e.g. Shopping"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalFormLabel}>Color</Text>
                <View style={styles.colorSelectorRow}>
                  {COLORS.map((col) => (
                    <TouchableOpacity
                      key={col}
                      style={[styles.colorDot, { backgroundColor: col }, newCatColor === col && { borderColor: col, borderWidth: 3 }]}
                      onPress={() => setNewCatColor(col)}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalFormLabel}>Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelectorRow}>
                  {ICONS.map((ic) => (
                    <TouchableOpacity
                      key={ic}
                      style={[styles.smallIconOption, newCatIcon === ic && styles.smallIconOptionSelected]}
                      onPress={() => setNewCatIcon(ic)}
                    >
                      <Feather name={ic as any} size={18} color={newCatIcon === ic ? Colors.accent : Colors.textTertiary} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {!!newCatError && <Text style={styles.errorText}>{newCatError}</Text>}
              <TouchableOpacity style={styles.primaryBtnLarge} onPress={handleSaveNewCategory} activeOpacity={0.85}>
                <Text style={styles.primaryBtnLargeText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  scrollGrow: { paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  monthDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  monthDropdownText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
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
  adjustLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent + "18",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  adjustLinkText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  adjustIcon: { marginLeft: 4 },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 150,
    marginTop: 8,
  },
  gaugeTextOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: 50,
  },
  gaugeValueText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 2,
    fontVariant: ["tabular-nums"],
  },
  gaugeLabelText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  leftBadgeContainer: { alignItems: "center", marginTop: 8 },
  leftBadge: {
    backgroundColor: Colors.accentPositive + "15",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.accentPositive,
    overflow: "hidden",
  },
  leftBadgeBold: { fontFamily: "Inter_700Bold", fontVariant: ["tabular-nums"] as any },
  categorySection: {},
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  categoryItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemRowLeft: { flexDirection: "row", alignItems: "center", flex: 1.1 },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryMeta: {},
  categoryName: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginBottom: 2 },
  transactionCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  itemRowRight: { alignItems: "flex-end", flex: 0.9 },
  spendingFraction: { fontSize: 12, marginBottom: 8 },
  spentBold: { fontFamily: "Inter_700Bold", color: Colors.textPrimary, fontVariant: ["tabular-nums"] as any },
  allocatedLimit: { fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  progressBarTrack: { height: 4, width: 110, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 2 },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end" },
  modalSheet: {
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
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accent + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  adjustModalKeyboard: { flex: 1 },
  modalFormLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalTextInput: {
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
  modalSectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  adjustCategoryList: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRowLeft: { flexDirection: "row", alignItems: "center" },
  categoryNameText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textPrimary },
  categoryInputContainer: {
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
  categoryInputDollar: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textTertiary, marginRight: 2 },
  categoryAllocInput: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    flex: 1,
    padding: 0,
    textAlign: "right",
  },
  addCategoryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  addCategoryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  amountLeftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  amountLeftLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  amountLeftValText: { fontSize: 16, fontFamily: "Inter_700Bold", fontVariant: ["tabular-nums"] },
  primaryBtnLarge: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  primaryBtnLargeText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_700Bold" },
  modalFormGroup: { marginBottom: 16 },
  colorSelectorRow: { flexDirection: "row", justifyContent: "space-between" },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  iconSelectorRow: { flexDirection: "row" },
  smallIconOption: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  smallIconOptionSelected: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + "18",
  },
  errorText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.accentNegative, marginBottom: 12 },
  adjustInputRow: { marginBottom: 12 },
});
