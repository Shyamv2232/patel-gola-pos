import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import type { PaymentMode } from "@/constants/flavors";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mode: PaymentMode) => void;
}

export default function PaymentModal({
  visible,
  onClose,
  onSelect,
}: PaymentModalProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.content,
            { backgroundColor: colors.card, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            Select Payment Method
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            How did the customer pay for this order?
          </Text>

          <View style={styles.options}>
            <Pressable
              onPress={() => onSelect("cash")}
              style={({ pressed }) => [
                styles.optionBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="dollar-sign" size={20} color="#fff" />
              <Text style={styles.optionText}>Cash Payment</Text>
            </Pressable>

            <Pressable
              onPress={() => onSelect("online")}
              style={({ pressed }) => [
                styles.optionBtn,
                {
                  backgroundColor: colors.info,
                  opacity: pressed ? 0.9 : 1,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="credit-card" size={20} color="#fff" />
              <Text style={styles.optionText}>Online / UPI</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    textAlign: "center",
  },
  options: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
