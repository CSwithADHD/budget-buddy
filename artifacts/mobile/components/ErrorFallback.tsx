import { Feather } from "@expo/vector-icons";
import { reloadAppAsync } from "expo";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) details += `Stack Trace:\n${error.stack}`;
    return details;
  };

  const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.topButton,
            { top: insets.top + 16, backgroundColor: Colors.surface, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="alert-circle" size={20} color={Colors.accentNegative} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Feather name="alert-triangle" size={40} color={Colors.accentNegative} />
        </View>
        <Text style={[styles.title, { color: Colors.textPrimary }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: Colors.textTertiary }]}>
          Please reload the app to continue.
        </Text>
        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: Colors.accent, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>Try Again</Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: Colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: Colors.border }]}>
                <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Error Details</Text>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  accessibilityLabel="Close error details"
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="x" size={24} color={Colors.textPrimary} />
                </Pressable>
              </View>
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 16 }]}
                showsVerticalScrollIndicator
              >
                <View style={[styles.errorContainer, { backgroundColor: Colors.background }]}>
                  <Text
                    style={[styles.errorText, { color: Colors.textTertiary, fontFamily: monoFont }]}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.accentNegative + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    width: "100%",
    maxWidth: 600,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  topButton: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  modalScrollView: { flex: 1 },
  modalScrollContent: { padding: 16 },
  errorContainer: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: { fontSize: 12, lineHeight: 18, width: "100%" },
});
