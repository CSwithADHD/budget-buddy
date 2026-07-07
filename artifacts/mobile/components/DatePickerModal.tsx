import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

function generateRecentDates(count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.now() - i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  value: string;
  onChange: (date: string) => void;
}

export default function DatePickerModal({ value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const dates = generateRecentDates(30);

  if (Platform.OS === "web") {
    return (
      <TextInput
        style={styles.webInput}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={Colors.textTertiary}
      />
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Feather name="calendar" size={18} color={Colors.accentPositive} />
        <Text style={styles.triggerText}>{formatDisplay(value)}</Text>
        <Feather name="chevron-down" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Date</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Feather name="x" size={22} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={dates}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <TouchableOpacity
                  style={[styles.dateRow, selected && styles.dateRowSelected]}
                  onPress={() => {
                    onChange(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selected && styles.dateTextSelected,
                    ]}
                  >
                    {formatDisplay(item)}
                  </Text>
                  {selected && (
                    <Feather name="check" size={18} color={Colors.accentPositive} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 16,
    maxHeight: "60%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateRowSelected: {
    backgroundColor: Colors.accentPositive + "15",
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  dateTextSelected: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.accentPositive,
  },
  webInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
});
