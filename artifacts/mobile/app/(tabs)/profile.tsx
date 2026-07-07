import React from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useBudget } from "@/context/BudgetContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";

export default function ProfileScreen() {
  const { data, refresh } = useBudget();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleResetData = () => {
    Alert.alert(
      "Reset All Data",
      "Are you sure you want to clear all data and start onboarding again?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            await refresh();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const handleAdjustBudget = () => {
    router.push("/spending-insight" as any);
  };

  const topPad = Platform.OS === "web" ? 32 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 24, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={require("../../assets/images/avatar_parzival.png")}
            style={styles.avatarLarge}
          />
          <Text style={styles.nameText}>{data.name || "Parzival"}</Text>
          <Text style={styles.emailText}>parzival@fintrack.app</Text>
        </View>

        {/* Menu Section */}
        <Text style={styles.sectionLabel}>Account Settings</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleAdjustBudget} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: Colors.accent + "18" }]}>
                <Feather name="sliders" size={18} color={Colors.accent} />
              </View>
              <Text style={styles.menuItemText}>Adjust Budget & Categories</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(tabs)/statement")}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: "#0284C715" }]}>
                <Feather name="file-text" size={18} color="#3B9EE0" />
              </View>
              <Text style={styles.menuItemText}>View Full Statement</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: Colors.accentNegative + "18" }]}>
                <Feather name="trash-2" size={18} color={Colors.accentNegative} />
              </View>
              <Text style={[styles.menuItemText, { color: Colors.accentNegative }]}>Reset App Data</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={Colors.accent} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            fintrack stores your data locally on your device. Clearing app storage or clicking Reset will wipe your transaction history.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20 },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  nameText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
