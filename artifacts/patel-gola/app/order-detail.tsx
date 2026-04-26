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
import PaymentModal from "@/components/PaymentModal";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { OrderItem, PaymentMode } from "@/constants/flavors";

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
    updateItemInOrder,
    removeItemFromOrder,
    completeOrder,
  } = useApp();

  const order = [...activeOrders, ...completedOrders].find(
    (o) => o.id === orderId
  );

  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showAddMore, setShowAddMore] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFlavors, setEditFlavors] = useState<string[]>([]);
  const [editTypeId, setEditTypeId] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

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
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
    removeItemFromOrder(order.id, itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startEditItem = (item: OrderItem) => {
    setShowAddMore(false);
    setEditingItemId(item.id);
    setEditFlavors([...item.flavorIds]);
    setEditTypeId(item.typeId);
    setEditQuantity(item.quantity);
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditFlavors([]);
    setEditTypeId("");
    setEditQuantity(1);
  };

  const toggleEditFlavor = (id: string) => {
    setEditFlavors((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const saveEditItem = () => {
    if (!editingItemId || editFlavors.length === 0 || !editTypeId) {
      Alert.alert("Error", "Select at least one flavor and one item type.");
      return;
    }
    updateItemInOrder(order.id, {
      id: editingItemId,
      flavorIds: editFlavors,
      typeId: editTypeId,
      quantity: editQuantity,
    });
    cancelEditItem();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const finishOrder = (paymentMode: PaymentMode, finalAmount: number) => {
    completeOrder(order.id, paymentMode, finalAmount);
    setPaymentModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleComplete = () => {
    if (Platform.OS === "web") {
      setPaymentModalVisible(true);
    } else {
      Alert.alert("Payment Mode", "Select payment mode for this order.", [
        { text: "Cancel", style: "cancel" },
        { text: "Cash", onPress: () => finishOrder("cash") },
        { text: "Online", onPress: () => finishOrder("online") },
      ]);
    }
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
          const isEditing = editingItemId === item.id;
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
              <View style={styles.itemTopRow}>
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
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() =>
                        isEditing ? cancelEditItem() : startEditItem(item)
                      }
                      style={[
                        styles.smallActionBtn,
                        { backgroundColor: colors.info + "18" },
                      ]}
                    >
                      <Feather
                        name={isEditing ? "chevron-up" : "edit-2"}
                        size={14}
                        color={colors.info}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveItem(item.id)}
                      style={[
                        styles.smallActionBtn,
                        { backgroundColor: colors.destructive + "15" },
                      ]}
                    >
                      <Feather
                        name="x"
                        size={14}
                        color={colors.destructive}
                      />
                    </Pressable>
                  </View>
                )}
              </View>

              {isEditing && (
                <View
                  style={[
                    styles.editPanel,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.editLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Change Flavors
                  </Text>
                  <View style={styles.flavorGrid}>
                    {activeFlavors.map((flavor) => (
                      <FlavorCard
                        key={flavor.id}
                        flavor={flavor}
                        selected={editFlavors.includes(flavor.id)}
                        onPress={() => toggleEditFlavor(flavor.id)}
                      />
                    ))}
                  </View>

                  <Text
                    style={[
                      styles.editLabel,
                      { color: colors.mutedForeground, marginTop: 8 },
                    ]}
                  >
                    Change Type
                  </Text>
                  <View style={styles.editTypeGrid}>
                    {itemTypes.map((itemType) => {
                      const selected = editTypeId === itemType.id;
                      return (
                        <Pressable
                          key={itemType.id}
                          onPress={() => setEditTypeId(itemType.id)}
                          style={[
                            styles.editTypeBtn,
                            {
                              backgroundColor: selected
                                ? colors.primary
                                : colors.background,
                              borderColor: colors.primary,
                              borderRadius: colors.radius,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.editTypeName,
                              {
                                color: selected
                                  ? colors.primaryForeground
                                  : colors.primary,
                              },
                            ]}
                          >
                            {itemType.name}
                          </Text>
                          <Text
                            style={[
                              styles.editTypePrice,
                              {
                                color: selected
                                  ? colors.primaryForeground
                                  : colors.mutedForeground,
                              },
                            ]}
                          >
                            Rs.{itemType.price}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.quantityRow}>
                    <Text
                      style={[
                        styles.editLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Quantity
                    </Text>
                    <View style={styles.quantityControls}>
                      <Pressable
                        onPress={() =>
                          setEditQuantity((current) =>
                            Math.max(1, current - 1)
                          )
                        }
                        style={[
                          styles.quantityBtn,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                      >
                        <Feather
                          name="minus"
                          size={16}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Text
                        style={[
                          styles.quantityText,
                          { color: colors.foreground },
                        ]}
                      >
                        {editQuantity}
                      </Text>
                      <Pressable
                        onPress={() =>
                          setEditQuantity((current) => current + 1)
                        }
                        style={[
                          styles.quantityBtn,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                      >
                        <Feather
                          name="plus"
                          size={16}
                          color={colors.primary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.editActionRow}>
                    <Pressable
                      onPress={cancelEditItem}
                      style={[
                        styles.editCancelBtn,
                        {
                          borderColor: colors.border,
                          borderRadius: colors.radius,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.editCancelText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={saveEditItem}
                      style={[
                        styles.editSaveBtn,
                        {
                          backgroundColor: colors.success,
                          borderRadius: colors.radius,
                        },
                      ]}
                    >
                      <Feather name="check" size={16} color="#fff" />
                      <Text style={styles.editSaveText}>Save Changes</Text>
                    </Pressable>
                  </View>
                </View>
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

      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSelect={finishOrder}
        initialAmount={total}
      />
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
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
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
  itemActions: {
    flexDirection: "row",
    gap: 6,
  },
  smallActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  editPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  editLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  editTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  editTypeBtn: {
    width: "48%",
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  editTypeName: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  editTypePrice: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  editActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  editCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 11,
  },
  editCancelText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  editSaveBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  editSaveText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
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
