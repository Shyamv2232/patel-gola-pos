import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CurrentOrderBar from "@/components/CurrentOrderBar";
import FlavorCard from "@/components/FlavorCard";
import ItemTypeButton from "@/components/ItemTypeButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { OrderItem } from "@/constants/flavors";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function NewOrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { flavors, itemTypes, createOrder, todayRevenue, todayOrderCount } =
    useApp();

  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [currentItems, setCurrentItems] = useState<OrderItem[]>([]);

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

  const handleAddItem = () => {
    if (selectedFlavors.length === 0) {
      Alert.alert("Select Flavors", "Please select at least one flavor.");
      return;
    }
    const hasQuantity = Object.values(quantities).some((q) => q > 0);
    if (!hasQuantity) {
      Alert.alert("Select Type", "Tap a type button to set quantity.");
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

    setCurrentItems((prev) => [...prev, ...newItems]);
    setSelectedFlavors([]);
    setQuantities({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSubmitOrder = () => {
    if (currentItems.length === 0) return;
    createOrder(currentItems);
    setCurrentItems([]);
    setSelectedFlavors([]);
    setQuantities({});
  };

  const handleClearOrder = () => {
    setCurrentItems([]);
    setSelectedFlavors([]);
    setQuantities({});
  };

  const hasSelection =
    selectedFlavors.length > 0 &&
    Object.values(quantities).some((q) => q > 0);

  const webTopPad = Platform.OS === "web" ? 67 : 0;

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
        <Text style={styles.stallName}>Patel Gola</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayOrderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: "#ffffff40" }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Rs.{todayRevenue}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Select Flavors
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

        {selectedFlavors.length > 0 && (
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedText, { color: colors.info }]}>
              {selectedFlavors.length} flavor
              {selectedFlavors.length !== 1 ? "s" : ""} selected
            </Text>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom:
              Platform.OS === "web" ? 34 : Math.max(insets.bottom, 10),
          },
        ]}
      >
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
            onPress={handleAddItem}
            style={({ pressed }) => [
              styles.addItemBtn,
              {
                backgroundColor: colors.accent,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="plus" size={18} color={colors.accentForeground} />
            <Text
              style={[
                styles.addItemText,
                { color: colors.accentForeground },
              ]}
            >
              Add Item
            </Text>
          </Pressable>
        )}
        <CurrentOrderBar
          currentItems={currentItems}
          itemTypes={itemTypes}
          onSubmit={handleSubmitOrder}
          onClear={handleClearOrder}
        />
      </View>
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
  stallName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#ffffffcc",
  },
  statDivider: {
    width: 1,
    height: 30,
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
  flavorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  selectedInfo: {
    alignItems: "center",
    marginTop: 8,
  },
  selectedText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  typeRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  addItemText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
