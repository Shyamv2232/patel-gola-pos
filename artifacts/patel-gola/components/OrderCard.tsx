import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Order, PaymentMode } from "@/constants/flavors";

interface Props {
  order: Order;
  onPress: () => void;
  showActions?: boolean;
  onCompletePress?: (orderId: string) => void;
  hideTotal?: boolean;
}

export default function OrderCard({
  order,
  onPress,
  showActions = true,
  onCompletePress,
  hideTotal = false,
}: Props) {
  const colors = useColors();
  const { flavors, itemTypes, getOrderTotal, completeOrder, deleteOrder } =
    useApp();

  const total = getOrderTotal(order);
  const time = new Date(order.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const finishOrder = (paymentMode: PaymentMode) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOrder(order.id, paymentMode);
  };

  const handleComplete = () => {
    if (onCompletePress) {
      onCompletePress(order.id);
      return;
    }
    Alert.alert("Payment Mode", "Select payment mode for this order.", [
      { text: "Cancel", style: "cancel" },
      { text: "Cash", onPress: () => finishOrder("cash") },
      { text: "Online", onPress: () => finishOrder("online") },
    ]);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteOrder(order.id);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderLeftColor: order.completed ? colors.success : colors.primary,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {time} {order.customerName ? `• ${order.customerName}` : ""}
          </Text>
          <Text style={[styles.itemCount, { color: colors.foreground }]}>
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Text style={[styles.total, { color: colors.primary }]}>
          {hideTotal ? "****" : `Rs.${total}`}
        </Text>
      </View>

      <View style={styles.items}>
        {order.items.slice(0, 3).map((item) => {
          const type = itemTypes.find((t) => t.id === item.typeId);
          const flavorNames = item.flavorIds
            .map((fid) => flavors.find((f) => f.id === fid)?.name ?? "")
            .filter(Boolean)
            .join(", ");
          return (
            <Text
              key={item.id}
              style={[styles.itemText, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {type?.name} x{item.quantity} - {flavorNames}
            </Text>
          );
        })}
        {order.items.length > 3 && (
          <Text style={[styles.moreText, { color: colors.info }]}>
            +{order.items.length - 3} more
          </Text>
        )}
        {order.completed && (
          <View
            style={[
              styles.paymentBadge,
              {
                backgroundColor: colors.secondary,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text
              style={[
                styles.paymentText,
                { color: colors.secondaryForeground },
              ]}
            >
              Payment:{" "}
              {order.paymentMode === "online"
                ? "Online"
                : order.paymentMode === "cash"
                  ? "Cash"
                  : "Not selected"}
            </Text>
          </View>
        )}
      </View>

      {showActions && !order.completed && (
        <View style={styles.actions}>
          <Pressable
            onPress={handleComplete}
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
          >
            <Feather name="check" size={16} color="#fff" />
            <Text style={styles.actionText}>Done</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={[styles.actionBtn, { backgroundColor: colors.destructive }]}
          >
            <Feather name="trash-2" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  time: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  itemCount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  total: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  items: {
    gap: 3,
  },
  itemText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  moreText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  paymentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 6,
  },
  paymentText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
