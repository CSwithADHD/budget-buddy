import React, { useState } from "react";
import {
  FlatList,
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
import * as Haptics from "expo-haptics";
import ReminderCard from "@/components/ReminderCard";
import DatePickerModal from "@/components/DatePickerModal";
import { useBudget } from "@/context/BudgetContext";
import { Colors } from "@/constants/colors";
import type { Reminder } from "@/types";

const REPEAT_OPTIONS: Array<{ label: string; value: Reminder["repeatType"] }> = [
  { label: "Once", value: "none" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

function RepeatChips({
  value,
  onChange,
}: {
  value: Reminder["repeatType"];
  onChange: (v: Reminder["repeatType"]) => void;
}) {
  return (
    <View style={styles.repeatRow}>
      {REPEAT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.repeatChip,
            value === opt.value && styles.repeatChipSelected,
          ]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.repeatChipText,
              value === opt.value && styles.repeatChipTextSelected,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RemindersScreen() {
  const { data, addReminder, updateReminder, deleteReminder } = useBudget();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(tomorrow);
  const [repeatType, setRepeatType] = useState<Reminder["repeatType"]>("none");
  const [titleError, setTitleError] = useState(false);

  const [editTarget, setEditTarget] = useState<Reminder | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState(tomorrow);
  const [editRepeat, setEditRepeat] = useState<Reminder["repeatType"]>("none");
  const [editTitleError, setEditTitleError] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) { setTitleError(true); return; }
    setTitleError(false);
    await addReminder({ title: title.trim(), date, repeatType });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTitle("");
    setDate(tomorrow);
    setRepeatType("none");
  };

  const openEdit = (reminder: Reminder) => {
    setEditTarget(reminder);
    setEditTitle(reminder.title);
    setEditDate(reminder.date);
    setEditRepeat(reminder.repeatType);
    setEditTitleError(false);
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) { setEditTitleError(true); return; }
    if (!editTarget) return;
    await updateReminder({ ...editTarget, title: editTitle.trim(), date: editDate, repeatType: editRepeat });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditTarget(null);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <>
      <FlatList
        data={data.reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topPad + 16, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.pageTitle}>Reminders</Text>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Reminder</Text>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={[styles.input, titleError && styles.inputError]}
                value={title}
                onChangeText={(t) => { setTitle(t); if (titleError) setTitleError(false); }}
                placeholder="e.g. Car Insurance"
                placeholderTextColor={Colors.textTertiary}
              />
              {titleError && <Text style={styles.errorText}>Please enter a title</Text>}

              <Text style={styles.label}>Date</Text>
              <DatePickerModal value={date} onChange={setDate} />

              <Text style={[styles.label, { marginTop: 14 }]}>Repeat</Text>
              <RepeatChips value={repeatType} onChange={setRepeatType} />

              <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
                <Feather name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Reminder</Text>
              </TouchableOpacity>
            </View>

            {data.reminders.length > 0 && (
              <Text style={styles.sectionTitle}>Upcoming</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ReminderCard reminder={item} onEdit={openEdit} onDelete={deleteReminder} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={36} color={Colors.border} />
            <Text style={styles.emptyText}>No reminders yet</Text>
            <Text style={styles.emptySubText}>Add reminders for bills, renewals, and more</Text>
          </View>
        }
      />

      <Modal
        visible={!!editTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setEditTarget(null)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setEditTarget(null)}
        />
        <View style={styles.editSheet}>
          <View style={styles.editSheetHandle} />
          <Text style={styles.editSheetTitle}>Edit Reminder</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, editTitleError && styles.inputError]}
              value={editTitle}
              onChangeText={(t) => { setEditTitle(t); if (editTitleError) setEditTitleError(false); }}
              placeholder="Reminder title"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            {editTitleError && <Text style={styles.errorText}>Please enter a title</Text>}

            <Text style={styles.label}>Date</Text>
            <DatePickerModal value={editDate} onChange={setEditDate} />

            <Text style={[styles.label, { marginTop: 14 }]}>Repeat</Text>
            <RepeatChips value={editRepeat} onChange={setEditRepeat} />

            <TouchableOpacity style={[styles.addBtn, { marginTop: 8 }]} onPress={handleUpdate} activeOpacity={0.85}>
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditTarget(null)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  inputError: {
    borderColor: Colors.accentNegative,
  },
  errorText: {
    color: Colors.accentNegative,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -10,
    marginBottom: 10,
  },
  repeatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  repeatChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  repeatChipSelected: {
    backgroundColor: Colors.accentPositive + "18",
    borderColor: Colors.accentPositive,
  },
  repeatChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  repeatChipTextSelected: {
    color: Colors.accentPositive,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accentPositive,
    borderRadius: 14,
    paddingVertical: 14,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  editSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "75%",
  },
  editSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  editSheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
});
