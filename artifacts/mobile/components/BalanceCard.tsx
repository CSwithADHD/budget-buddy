import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBudget } from "@/context/BudgetContext";
import { getCurrentMonth } from "@/utils/calculations";
import { Colors } from "@/constants/colors";

interface Props {
  spent: number;
}

export default function BalanceCard({ spent }: Props) {
  const router = useRouter();
  const { data, addDeposit } = useBudget();
  const [showBalance, setShowBalance] = useState(true);

  const currentMonth = getCurrentMonth();
  const totalDeposited = (data.deposits ?? [])
    .filter((d) => d.date.startsWith(currentMonth))
    .reduce((sum, d) => sum + d.amount, 0);

  const balance = data.budget + totalDeposited - spent;

  const displayBalance = showBalance
    ? Math.abs(balance).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "••••••";

  const isNegative = balance < 0;

  // ── Deposit modal ────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const openDepositModal = () => {
    setAmountText("");
    setNoteText("");
    setModalVisible(true);
  };

  const handleConfirmDeposit = async () => {
    const amount = parseFloat(amountText);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a positive number.");
      return;
    }
    setSaving(true);
    await addDeposit({
      amount,
      note: noteText.trim() || "Deposit",
      date: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    setModalVisible(false);
  };

  return (
    <>
      <View style={styles.card}>
        {/* Label & Eye Toggle */}
        <TouchableOpacity
          style={styles.labelRow}
          onPress={() => setShowBalance((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.labelText}>Total balance</Text>
          <Feather
            name={showBalance ? "eye-off" : "eye"}
            size={15}
            color={Colors.textTertiary}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>

        {/* Balance */}
        <View style={styles.balanceRow}>
          {showBalance && isNegative && (
            <Text style={[styles.balanceCurrency, { color: Colors.accentNegative }]}>−</Text>
          )}
          <Text style={[styles.balanceText, isNegative && { color: Colors.accentNegative }]}>
            {displayBalance}
          </Text>
          {showBalance && (
            <Text style={styles.balanceCurrency}>{data.currencySymbol}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionItem} onPress={openDepositModal} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <Feather name="plus" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/add" as any)} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <Feather name="arrow-up-right" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push("/(tabs)/statement" as any)} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <Feather name="pie-chart" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Insights</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deposit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%" }}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Add Deposit</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={20} color={Colors.accent} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Amount ({data.currency})</Text>
              <TextInput
                style={styles.input}
                value={amountText}
                onChangeText={setAmountText}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
              />

              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="e.g. Salary, Freelance payment…"
                placeholderTextColor={Colors.textTertiary}
              />

              <TouchableOpacity
                style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
                onPress={handleConfirmDeposit}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmBtnText}>
                  {saving ? "Saving…" : "Confirm Deposit"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 28,
  },
  balanceText: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginRight: 10,
    fontVariant: ["tabular-nums"],
  },
  balanceCurrency: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  actionItem: {
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    width: "100%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accent + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 4,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
