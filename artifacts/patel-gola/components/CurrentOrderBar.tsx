import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ItemType, OrderItem } from "@/constants/flavors";

interface Props {
  currentItems: OrderItem[];
  itemTypes: ItemType[];
  onSubmit: () => void;
  onClear: () => void;
}

export default function CurrentOrderBar({
  currentItems,
  itemTypes,
  onSubmit,
  onClear,
}: Props) {
  const colors = useColors();

  if (currentItems.length === 0) return null;

  const total = currentItems.reduce((sum, item) => {
    const type = itemTypes.find((t) => t.id === item.typeId);
    return sum + (type?.price ?? 0) * item.quantity;
  }, 0);

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary, borderRadius: colors.radius },
      ]}
    >
      <Pressable onPress={onClear} style={styles.clearBtn}>
        <Feather name="x" size={18} color={colors.primaryForeground} />
      </Pressable>
      <View style={styles.info}>
        <Text style={[styles.count, { color: colors.primaryForeground }]}>
          {currentItems.length} item{currentItems.length !== 1 ? "s" : ""}
        </Text>
        <Text style={[styles.total, { color: colors.primaryForeground }]}>
          Rs.{total}
        </Text>
      </View>
      <Pressable
        onPress={handleSubmit}
        style={[styles.submitBtn, { backgroundColor: "#ffffff30" }]}
      >
        <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
          Place Order
        </Text>
        <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clearBtn: {
    padding: 6,
  },
  info: {
    flex: 1,
    marginLeft: 8,
  },
  count: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  total: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
