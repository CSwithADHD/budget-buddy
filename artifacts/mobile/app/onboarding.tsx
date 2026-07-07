import React, { useRef, useState } from "react";
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
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useBudget } from "@/context/BudgetContext";
import { Colors } from "@/constants/colors";
import type { BudgetCategory } from "@/types";

const { width } = Dimensions.get("window");

const QUICK_AMOUNTS = [100, 200, 500, 1000];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
];

const PRESETS = [
  { name: "Self care", icon: "heart", color: "#EC4899" },
  { name: "Education", icon: "book-open", color: "#F97316" },
  { name: "Shopping", icon: "shopping-bag", color: "#06B6D4" },
  { name: "Lifestyle", icon: "coffee", color: "#F59E0B" },
];

const COLORS = [
  "#EC4899", "#F59E0B", "#3B82F6", "#06B6D4",
  "#8B5CF6", "#F97316", "#EF4444", "#A855F7",
];

const ICONS = [
  "shopping-bag", "book-open", "coffee", "heart",
  "truck", "activity", "gift", "smile",
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useBudget();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [totalBudget, setTotalBudget] = useState("6000");
  const [categories, setCategories] = useState<BudgetCategory[]>([
    { id: "1", name: "General", icon: "pie-chart", color: "#A855F7", allocated: 1000 },
    { id: "2", name: "Transportation", icon: "truck", color: "#3B82F6", allocated: 1000 },
    { id: "3", name: "Charity", icon: "heart", color: "#F43F5E", allocated: 1000 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);
  const [modalError, setModalError] = useState("");

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const getSumAllocated = () => categories.reduce((sum, c) => sum + c.allocated, 0);
  const amountLeft = parseFloat(totalBudget) ? parseFloat(totalBudget) - getSumAllocated() : 0;

  const triggerHaptic = (type: "light" | "success" | "error") => {
    if (Platform.OS !== "web") {
      if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNextStep = () => {
    if (!name.trim()) { setNameError("Please enter your name to continue"); shake(); triggerHaptic("error"); return; }
    setNameError(""); triggerHaptic("light"); setStep(1);
  };

  const handleCategoryAllocChange = (id: string, text: string) => {
    const numeric = parseFloat(text) || 0;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, allocated: numeric } : c)));
  };

  const handleQuickBudget = (amt: number) => { triggerHaptic("light"); setTotalBudget(amt.toString()); };

  const openCategoryModal = () => {
    triggerHaptic("light"); setNewCatName(""); setNewCatColor(COLORS[0]); setNewCatIcon(ICONS[0]); setModalError(""); setModalVisible(true);
  };

  const selectPreset = (p: typeof PRESETS[0]) => {
    triggerHaptic("light"); setNewCatName(p.name); setNewCatColor(p.color); setNewCatIcon(p.icon);
  };

  const handleSaveCategory = () => {
    if (!newCatName.trim()) { setModalError("Please enter a category name"); triggerHaptic("error"); return; }
    const exists = categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (exists) { setModalError("Category already exists"); triggerHaptic("error"); return; }
    const newCat: BudgetCategory = { id: Date.now().toString(), name: newCatName.trim(), icon: newCatIcon, color: newCatColor, allocated: 0 };
    setCategories((prev) => [...prev, newCat]);
    setModalVisible(false);
    triggerHaptic("success");
  };

  const handleSaveBudget = () => {
    const budgetVal = parseFloat(totalBudget) || 0;
    if (budgetVal <= 0) { triggerHaptic("error"); alert("Please enter a valid monthly budget"); return; }
    if (amountLeft < 0) { triggerHaptic("error"); alert("Your category allocations exceed your total budget!"); return; }
    triggerHaptic("light"); setStep(2);
  };

  const handleFinishOnboarding = async () => {
    triggerHaptic("success");
    const budgetVal = parseFloat(totalBudget) || 0;
    await completeOnboarding(name.trim(), budgetVal, 0, categories, currency.code, currency.symbol);
    router.replace("/(tabs)/" as any);
  };

  const topPad = Platform.OS === "web" ? 32 : insets.top;
  const bottomPad = Platform.OS === "web" ? 32 : insets.bottom;

  // STEP 0: Name
  if (step === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad + 40, paddingBottom: bottomPad + 24 }]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scrollGrow} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.centerSection}>
              <View style={styles.logoBadge}>
                <Feather name="trending-up" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.titleLarge}>fintrack</Text>
              <Text style={styles.subtitleText}>
                Let's personalise your budget tracker. This only takes a minute.
              </Text>
            </View>

            <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.fieldLabel}>What should we call you?</Text>
              <TextInput
                style={[styles.input, !!nameError && styles.inputError]}
                value={name}
                onChangeText={(t) => { setName(t); if (nameError) setNameError(""); }}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
                onSubmitEditing={handleNextStep}
              />
              {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

              <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Select your currency</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.currencyScroll}
              >
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyCard,
                      currency.code === curr.code && styles.currencyCardSelected,
                    ]}
                    onPress={() => { triggerHaptic("light"); setCurrency(curr); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.currencySymbolLarge}>{curr.symbol}</Text>
                    <Text style={styles.currencyCode}>{curr.code}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // STEP 1: Budget Setup
  if (step === 1) {
    return (
      <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)} activeOpacity={0.7}>
            <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Budget</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Budget amount card */}
            <View style={styles.budgetCard}>
              <View style={styles.budgetInputRow}>
                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                <TextInput
                  style={styles.budgetValueInput}
                  value={totalBudget}
                  onChangeText={setTotalBudget}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <Text style={styles.budgetCardSubtitle}>Set budget amount</Text>
              <View style={styles.quickAmountRow}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity key={amt} style={styles.quickAmountBtn} onPress={() => handleQuickBudget(amt)} activeOpacity={0.7}>
                    <Text style={styles.quickAmountText}>{currency.symbol}{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.categorySectionHeader}>
              <Text style={styles.sectionTitle}>Set Budget category</Text>
              <TouchableOpacity onPress={openCategoryModal} style={styles.editLink}>
                <Text style={styles.editLinkText}>Edit</Text>
                <Feather name="edit-2" size={12} color={Colors.accent} style={styles.editIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryCardList}>
              {categories.map((cat) => (
                <View key={cat.id} style={styles.categoryRow}>
                  <View style={styles.categoryRowLeft}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + "20" }]}>
                      <Feather name={cat.icon as any} size={18} color={cat.color} />
                    </View>
                    <Text style={styles.categoryNameText}>{cat.name}</Text>
                  </View>
                  <View style={styles.categoryInputContainer}>
                    <Text style={styles.categoryInputDollar}>{currency.symbol}</Text>
                    <TextInput
                      style={styles.categoryAllocInput}
                      value={cat.allocated.toString()}
                      onChangeText={(val) => handleCategoryAllocChange(cat.id, val)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addCategoryRow} onPress={openCategoryModal} activeOpacity={0.7}>
                <View style={styles.categoryRowLeft}>
                  <View style={styles.addCategoryCircle}>
                    <Feather name="plus" size={18} color={Colors.textTertiary} />
                  </View>
                  <Text style={styles.addCategoryText}>Add new category</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Amount left */}
            <View style={styles.amountLeftContainer}>
              <Text style={styles.amountLeftLabel}>Amount left:</Text>
              <View style={[styles.amountLeftBadge, { borderColor: amountLeft < 0 ? Colors.accentNegative : Colors.border }]}>
                <Text style={[styles.amountLeftText, { color: amountLeft < 0 ? Colors.accentNegative : Colors.textPrimary }]}>
                  {currency.symbol}{amountLeft.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtnLarge} onPress={handleSaveBudget} activeOpacity={0.85}>
              <Text style={styles.primaryBtnLargeText}>Get Started</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* New category modal */}
        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create new category</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                  <Feather name="x" size={20} color={Colors.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.iconPickerSection}>
                <View style={[styles.largeIconPreview, { backgroundColor: newCatColor + "20" }]}>
                  <Feather name={newCatIcon as any} size={28} color={newCatColor} />
                  <View style={styles.smallEditIndicator}>
                    <Feather name="edit-2" size={10} color={Colors.accent} />
                  </View>
                </View>
                <Text style={styles.iconPickerSubtitle}>Choose category icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelectorRow}>
                  {ICONS.map((ic) => (
                    <TouchableOpacity
                      key={ic}
                      style={[styles.smallIconOption, newCatIcon === ic && styles.smallIconOptionSelected]}
                      onPress={() => { triggerHaptic("light"); setNewCatIcon(ic); }}
                    >
                      <Feather name={ic as any} size={18} color={newCatIcon === ic ? Colors.accent : Colors.textTertiary} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalFormLabel}>Category name</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newCatName}
                  onChangeText={(t) => { setNewCatName(t); if (modalError) setModalError(""); }}
                  placeholder="Set name for category"
                  placeholderTextColor={Colors.textTertiary}
                />
                <View style={styles.quickPresetRow}>
                  {PRESETS.map((p) => (
                    <TouchableOpacity key={p.name} style={styles.presetTag} onPress={() => selectPreset(p)} activeOpacity={0.7}>
                      <Text style={styles.presetTagText}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalFormLabel}>Select color</Text>
                <View style={styles.colorSelectorRow}>
                  {COLORS.map((col) => (
                    <TouchableOpacity
                      key={col}
                      style={[styles.colorDot, { backgroundColor: col }, newCatColor === col && { borderColor: col, borderWidth: 3 }]}
                      onPress={() => { triggerHaptic("light"); setNewCatColor(col); }}
                    >
                      {newCatColor === col && <View style={styles.colorDotInnerRing} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {!!modalError && <Text style={styles.errorText}>{modalError}</Text>}

              <TouchableOpacity style={styles.primaryBtnLarge} onPress={handleSaveCategory} activeOpacity={0.85}>
                <Text style={styles.primaryBtnLargeText}>Save category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // STEP 2: Success
  return (
    <View style={[styles.container, { paddingTop: topPad + 40, paddingBottom: bottomPad + 24 }]}>
      <ScrollView contentContainerStyle={styles.scrollGrow} showsVerticalScrollIndicator={false}>
        <View style={styles.successCenter}>
          <View style={styles.successCheckCircle}>
            <Feather name="check" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Your budget has been set up!</Text>
          <Text style={styles.successSubtitle}>
            Track your expenses and stay on top of your financial goals. You can always adjust your budget if needed.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.summaryRow}>
              <View style={styles.categoryRowLeft}>
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + "20" }]}>
                  <Feather name={cat.icon as any} size={16} color={cat.color} />
                </View>
                <Text style={styles.summaryCategoryName}>{cat.name}</Text>
              </View>
              <Text style={styles.summaryAllocatedText}>
                {currency.symbol}{cat.allocated.toLocaleString("en-US")}
              </Text>
            </View>
          ))}

          <View style={styles.dashedLine} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total budgeted</Text>
            <Text style={styles.summaryTotalVal}>
              {currency.symbol}{(parseFloat(totalBudget) || 0).toLocaleString("en-US")}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtnLarge} onPress={handleFinishOnboarding} activeOpacity={0.85}>
          <Text style={styles.primaryBtnLargeText}>View my dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  flex: { flex: 1 },
  scrollGrow: { flexGrow: 1, justifyContent: "space-between" },
  scrollContainer: { paddingBottom: 24 },
  centerSection: {
    alignItems: "center",
    marginTop: 64,
    marginBottom: 40,
  },
  logoBadge: {
    backgroundColor: Colors.accent + "18",
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  titleLarge: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    marginBottom: 32,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputError: { borderColor: Colors.accentNegative },
  errorText: {
    color: Colors.accentNegative,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  headerRightPlaceholder: { width: 40 },
  budgetCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  budgetInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  currencySymbol: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
    marginRight: 4,
  },
  budgetValueInput: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    minWidth: 100,
    textAlign: "center",
    padding: 0,
    fontVariant: ["tabular-nums"],
  },
  budgetCardSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    marginBottom: 20,
  },
  quickAmountRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  quickAmountBtn: {
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  categorySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  editLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editLinkText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  editIcon: { marginLeft: 4 },
  categoryCardList: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRowLeft: { flexDirection: "row", alignItems: "center" },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryNameText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  categoryInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 90,
  },
  categoryInputDollar: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    marginRight: 2,
  },
  categoryAllocInput: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    flex: 1,
    padding: 0,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  addCategoryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  addCategoryCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addCategoryText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  amountLeftContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  amountLeftLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    marginRight: 8,
  },
  amountLeftBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  amountLeftText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
  primaryBtnLarge: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryBtnLargeText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
  iconPickerSection: { alignItems: "center", marginBottom: 24 },
  largeIconPreview: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  smallEditIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.surface,
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconPickerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    marginBottom: 12,
  },
  iconSelectorRow: { flexDirection: "row", width: "100%" },
  smallIconOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  smallIconOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + "18",
  },
  modalFormGroup: { marginBottom: 20 },
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
    marginBottom: 10,
  },
  quickPresetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetTag: {
    backgroundColor: Colors.accent + "18",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  presetTagText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.accent },
  colorSelectorRow: { flexDirection: "row", justifyContent: "space-between" },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotInnerRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  successCenter: { alignItems: "center", marginTop: 48, marginBottom: 32 },
  successCheckCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accentPositive,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryCategoryName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  summaryAllocatedText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  dashedLine: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  summaryTotalVal: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  currencyScroll: {
    marginBottom: 16,
  },
  currencyCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: 80,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  currencyCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + "18",
  },
  currencySymbolLarge: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  currencyCode: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
  },
});
