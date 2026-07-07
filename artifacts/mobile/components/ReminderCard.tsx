import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { formatDate } from "@/utils/calculations";
import { Colors } from "@/constants/colors";
import type { Reminder } from "@/types";

function getReminderStatus(dateStr: string): "overdue" | "soon" | "future" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = (d.getTime() - today.getTime()) / 86400000;
  if (diff < 0) return "overdue";
  if (diff <= 7) return "soon";
  return "future";
}

const STATUS_COLORS = {
  overdue: Colors.accentNegative,
  soon: "#C9A010",
  future: Colors.accentPositive,
};

const REPEAT_LABELS: Record<string, string> = {
  none: "Once",
  monthly: "Monthly",
  yearly: "Yearly",
};

interface Props {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export default function ReminderCard({ reminder, onEdit, onDelete }: Props) {
  const status = getReminderStatus(reminder.date);
  const borderColor = STATUS_COLORS[status];

  const handleDelete = () => {
    Alert.alert(
      "Delete Reminder",
      `Delete "${reminder.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(reminder.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.iconWrap}>
        <Feather name="bell" size={18} color={borderColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{reminder.title}</Text>
        <Text style={styles.sub}>
          {formatDate(reminder.date)} · {REPEAT_LABELS[reminder.repeatType]}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onEdit(reminder)}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
      >
        <Feather name="edit-2" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      >
        <Feather name="trash-2" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  iconWrap: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  iconBtn: {
    padding: 6,
    marginLeft: 2,
  },
});
