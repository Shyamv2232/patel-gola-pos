import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import OrderCard from "@/components/OrderCard";
import PaymentModal from "@/components/PaymentModal";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { PaymentMode } from "@/constants/flavors";

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeOrders, completeOrder, itemTypes } = useApp();
  const [paymentModalVisible, setPaymentModalVisible] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

   const webTopPad = Platform.OS === "web" ? 67 : 0;

  const handleCompleteOrder = (mode: PaymentMode, finalAmount?: number) => {
    if (selectedOrderId) {
      completeOrder(selectedOrderId, mode, finalAmount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPaymentModalVisible(false);
    setSelectedOrderId(null);
  };

  const selectedOrder = activeOrders.find(o => o.id === selectedOrderId);
  // Calculate total normally to prepopulate it
  const selectedOrderTotal = selectedOrder ? selectedOrder.items.reduce((total, item) => {
    const type = itemTypes.find((t) => t.id === item.typeId);
    return total + (type?.price ?? 0) * item.quantity;
  }, 0) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 10,
          },
        ]}
      >
        <Text style={styles.title}>Active Orders</Text>
        <Text style={styles.subtitle}>{activeOrders.length} pending</Text>
      </View>

      {activeOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color={colors.mutedForeground} />
          <Text
            style={[styles.emptyText, { color: colors.mutedForeground }]}
          >
            No active orders
          </Text>
          <Text
            style={[styles.emptySubtext, { color: colors.mutedForeground }]}
          >
            Create a new order from the New Order tab
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() =>
                router.push({
                  pathname: "/order-detail",
                  params: { orderId: item.id },
                })
              }
              onCompletePress={(id: string) => {
                setSelectedOrderId(id);
                setPaymentModalVisible(true);
              }}
            />
          )}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={activeOrders.length > 0}
        />
      )}

      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => {
          setPaymentModalVisible(false);
          setSelectedOrderId(null);
        }}
        onSelect={handleCompleteOrder}
        initialAmount={selectedOrderTotal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#ffffffcc",
    textAlign: "center",
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  list: {
    padding: 12,
  },
});
