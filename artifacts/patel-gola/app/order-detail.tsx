import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FlavorCard from "@/components/FlavorCard";
import ItemTypeButton from "@/components/ItemTypeButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { OrderItem } from "@/constants/flavors";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const {
    flavors,
    itemTypes,
    activeOrders,
    completedOrders,
    getOrderTotal,
    addItemsToOrder,
    removeItemFromOrder,
    completeOrder,
  } = useApp();

  const order = [...activeOrders, ...completedOrders].find(
    (o) => o.id === orderId
  );

  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showAddMore, setShowAddMore] = useState(false);

  if (!order) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.primary,
              paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 10,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Order Not Found</Text>
          <View style={{ width: 22 }} />
        </View>
      </View>
    );
  }

  const total = getOrderTotal(order);
  const activeFlavors = flavors.filter((f) => f.active);

  const toggleFlavor = (id: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleTypePress = (typeId: string) => {
    if (selectedFlavors.length === 0) {
      Alert.alert("Select Flavors", "Please select at least one flavor first.");
      return;
    }
    setQuantities((prev) => ({
      ...prev,
      [typeId]: (prev[typeId] ?? 0) + 1,
    }));
  };

  const handleTypeLongPress = (typeId: string) => {
    setQuantities((prev) => {
      const current = prev[typeId] ?? 0;
      if (current <= 0) return prev;
      const next = { ...prev };
      if (current === 1) {
        delete next[typeId];
      } else {
        next[typeId] = current - 1;
      }
      return next;
    });
  };

  const handleAddItems = () => {
    const hasQuantity = Object.values(quantities).some((q) => q > 0);
    if (selectedFlavors.length === 0 || !hasQuantity) {
      Alert.alert("Error", "Select flavors and type.");
      return;
    }
    const newItems: OrderItem[] = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([typeId, quantity]) => ({
        id: generateId(),
        flavorIds: [...selectedFlavors],
        typeId,
        quantity,
      }));
    addItemsToOrder(order.id, newItems);
    setSelectedFlavors([]);
    setQuantities({});
    setShowAddMore(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemFromOrder(order.id, itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleComplete = () => {
    completeOrder(order.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const hasSelection =
    selectedFlavors.length > 0 &&
    Object.values(quantities).some((q) => q > 0);

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        <Text style={styles.headerTotal}>Rs.{total}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Items
        </Text>
        {order.items.map((item) => {
          const type = itemTypes.find((t) => t.id === item.typeId);
          const flavorNames = item.flavorIds
            .map((fid) => flavors.find((f) => f.id === fid)?.name ?? "")
            .filter(Boolean)
            .join(", ");
          const itemTotal = (type?.price ?? 0) * item.quantity;
          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text
                  style={[styles.itemType, { color: colors.foreground }]}
                >
                  {type?.name} x{item.quantity}
                </Text>
                <Text
                  style={[
                    styles.itemFlavors,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {flavorNames}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                Rs.{itemTotal}
              </Text>
              {!order.completed && (
                <Pressable
                  onPress={() => handleRemoveItem(item.id)}
                  style={[
                    styles.removeBtn,
                    { backgroundColor: colors.destructive + "15" },
                  ]}
                >
                  <Feather
                    name="x"
                    size={14}
                    color={colors.destructive}
                  />
                </Pressable>
              )}
            </View>
          );
        })}

        {!order.completed && (
          <>
            {showAddMore ? (
              <View style={styles.addMoreSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.foreground, marginTop: 16 },
                  ]}
                >
                  Add More Items
                </Text>
                <View style={styles.flavorGrid}>
                  {activeFlavors.map((flavor) => (
                    <FlavorCard
                      key={flavor.id}
                      flavor={flavor}
                      selected={selectedFlavors.includes(flavor.id)}
                      onPress={() => toggleFlavor(flavor.id)}
                    />
                  ))}
                </View>

                <View style={styles.typeRow}>
                  {itemTypes.map((type) => (
                    <ItemTypeButton
                      key={type.id}
                      itemType={type}
                      quantity={quantities[type.id] ?? 0}
                      onPress={() => handleTypePress(type.id)}
                      onLongPress={() => handleTypeLongPress(type.id)}
                    />
                  ))}
                </View>

                {hasSelection && (
                  <Pressable
                    onPress={handleAddItems}
                    style={[
                      styles.confirmAddBtn,
                      {
                        backgroundColor: colors.accent,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <Feather name="plus" size={18} color="#fff" />
                    <Text style={styles.confirmAddText}>Add to Order</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Pressable
                onPress={() => setShowAddMore(true)}
                style={[
                  styles.addMoreBtn,
                  {
                    borderColor: colors.primary,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Feather name="plus" size={18} color={colors.primary} />
                <Text
                  style={[styles.addMoreText, { color: colors.primary }]}
                >
                  Add More Items
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleComplete}
              style={[
                styles.completeBtn,
                {
                  backgroundColor: colors.success,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.completeText}>Complete Order</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerTotal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemType: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  itemFlavors: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginRight: 10,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  addMoreSection: {},
  flavorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  typeRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 8,
  },
  confirmAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  confirmAddText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  addMoreText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
  },
  completeText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
