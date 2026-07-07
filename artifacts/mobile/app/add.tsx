import React, { useRef, useState } from "react";
import {
  Animated,
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
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import DatePickerModal from "@/components/DatePickerModal";
import SuccessToast from "@/components/SuccessToast";
import { useBudget } from "@/context/BudgetContext";
import { Colors } from "@/constants/colors";
import {
  getCurrentMonth,
  getRemainingBalance,
  getTotalSpent,
} from "@/utils/calculations";

export default function AddExpenseScreen() {
  const { addExpense, data, updateCategories } = useBudget();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(data.categories[0]?.name || "General");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amountError, setAmountError] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryNameError, setCategoryNameError] = useState(false);

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

  const CATEGORY_COLORS = [
    "#A855F7", "#3B82F6", "#F43F5E", "#F97316", "#EAB308", 
    "#22C55E", "#06B6D4", "#EC4899", "#6366F1", "#14B8A6"
  ];

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryNameError(true);
      return;
    }

    if (data.categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      setCategoryNameError(true);
      setToastMsg("Category already exists!");
      setToastVisible(true);
      return;
    }

    setCategoryNameError(false);
    const newCategoryId = `custom_${Date.now()}`;
    const colorIndex = data.categories.length % CATEGORY_COLORS.length;
    const newCategory = {
      id: newCategoryId,
      name: newCategoryName.trim(),
      icon: "tag",
      color: CATEGORY_COLORS[colorIndex],
      allocated: 0,
    };

    await updateCategories([...data.categories, newCategory]);
    setCategory(newCategory.name);
    setNewCategoryName("");
    setShowAddCategoryModal(false);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setToastMsg(`Category "${newCategory.name}" added!`);
    setToastVisible(true);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError(true);
      shake();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setAmountError(false);
    await addExpense({ amount: parsedAmount, category, description, date });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const currentMonth = getCurrentMonth();
    const newTotal = getTotalSpent(
      [...data.expenses, { id: "tmp", amount: parsedAmount, category, description, date }],
      currentMonth
    );
    const newRemaining = getRemainingBalance(data.budget, newTotal);
    setToastMsg(`Transaction saved! Balance left: $${newRemaining.toFixed(2)}`);
    setToastVisible(true);

    setAmount("");
    setCategory(data.categories[0]?.name || "General");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));

    setTimeout(() => {
      setToastVisible(false);
      router.back();
    }, 2000);
  };

  const topPad = Platform.OS === "web" ? 32 : insets.top;
  const bottomPad = Platform.OS === "web" ? 32 : insets.bottom + 16;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.headerRow, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Add Transaction</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.label}>Amount ($)</Text>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              style={[styles.amountInput, amountError && styles.inputError]}
              value={amount}
              onChangeText={(t) => { setAmount(t); if (amountError) setAmountError(false); }}
              keyboardType="numeric"
              placeholder="$0.00"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
          </Animated.View>
          {amountError && <Text style={styles.errorText}>Please enter a valid amount</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {data.categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.chip,
                  category === cat.name && styles.chipSelected,
                  category === cat.name && { backgroundColor: cat.color + "25", borderColor: cat.color },
                ]}
                onPress={() => setCategory(cat.name)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === cat.name && { color: cat.color },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.chip, styles.addCategoryChip]}
              onPress={() => setShowAddCategoryModal(true)}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color={Colors.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.chipText, { color: Colors.accent }]}>
                Add Custom
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this for?"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <DatePickerModal value={date} onChange={setDate} />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Transaction</Text>
        </TouchableOpacity>
      </ScrollView>

      <SuccessToast visible={toastVisible} message={toastMsg} />

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddCategoryModal(false);
          setCategoryNameError(false);
          setNewCategoryName("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginTop: insets.top + 40 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setShowAddCategoryModal(false);
                  setCategoryNameError(false);
                  setNewCategoryName("");
                }}
                activeOpacity={0.7}
              >
                <Feather name="x" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Category</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={[styles.textInput, categoryNameError && styles.inputError]}
                value={newCategoryName}
                onChangeText={(text) => {
                  setNewCategoryName(text);
                  if (categoryNameError) setCategoryNameError(false);
                }}
                placeholder="e.g., Groceries, Entertainment"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
              />
              {categoryNameError && (
                <Text style={styles.errorText}>Please enter a valid category name</Text>
              )}
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveButton, styles.modalButton]}
                onPress={handleAddCategory}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>Create Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  headerPlaceholder: { width: 40 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: { marginBottom: 24 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  inputError: {
    borderColor: Colors.accentNegative,
  },
  errorText: {
    color: Colors.accentNegative,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {},
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  addCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    marginTop: 0,
  },
});
