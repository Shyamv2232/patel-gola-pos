import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const PRESET_COLORS = [
  "#4361ee",
  "#e6a817",
  "#7b3f00",
  "#6a0dad",
  "#4a0e4e",
  "#2d1b69",
  "#a8c256",
  "#ffb347",
  "#f5e6ca",
  "#ff8c00",
  "#f7dc6f",
  "#ff69b4",
  "#daa520",
  "#ff4757",
  "#f3e5ab",
  "#06d6a0",
  "#118ab2",
  "#ef476f",
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    flavors,
    itemTypes,
    addFlavor,
    removeFlavor,
    updateFlavor,
    toggleFlavor,
    updateItemTypePrice,
  } = useApp();

  const [tab, setTab] = useState<"flavors" | "prices">("flavors");
  const [newFlavorName, setNewFlavorName] = useState("");
  const [newFlavorColor, setNewFlavorColor] = useState(PRESET_COLORS[0]);
  const [editingFlavor, setEditingFlavor] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");

  const handleAddFlavor = () => {
    if (!newFlavorName.trim()) {
      Alert.alert("Error", "Please enter a flavor name.");
      return;
    }
    addFlavor(newFlavorName.trim(), newFlavorColor);
    setNewFlavorName("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveFlavor = (id: string, name: string) => {
    Alert.alert("Remove Flavor", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          removeFlavor(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingFlavor(id);
    setEditName(name);
    setEditColor(color);
  };

  const handleSaveEdit = () => {
    if (!editingFlavor || !editName.trim()) return;
    updateFlavor(editingFlavor, editName.trim(), editColor);
    setEditingFlavor(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSavePrice = () => {
    if (!editingPrice) return;
    const price = parseInt(editPriceValue, 10);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price.");
      return;
    }
    updateItemTypePrice(editingPrice, price);
    setEditingPrice(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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
        <Text style={styles.title}>Admin</Text>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setTab("flavors")}
          style={[
            styles.tabBtn,
            {
              backgroundColor:
                tab === "flavors" ? colors.primary : colors.card,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  tab === "flavors"
                    ? colors.primaryForeground
                    : colors.foreground,
              },
            ]}
          >
            Flavors
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("prices")}
          style={[
            styles.tabBtn,
            {
              backgroundColor:
                tab === "prices" ? colors.primary : colors.card,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  tab === "prices"
                    ? colors.primaryForeground
                    : colors.foreground,
              },
            ]}
          >
            Prices
          </Text>
        </Pressable>
      </View>

      {tab === "flavors" ? (
        <FlatList
          data={flavors}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View
              style={[
                styles.addSection,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.addTitle, { color: colors.foreground }]}
              >
                Add New Flavor
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderColor: colors.input,
                    borderRadius: colors.radius,
                  },
                ]}
                placeholder="Flavor name"
                placeholderTextColor={colors.mutedForeground}
                value={newFlavorName}
                onChangeText={setNewFlavorName}
              />
              <View style={styles.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setNewFlavorColor(c)}
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor: c,
                        borderWidth: c === newFlavorColor ? 3 : 0,
                        borderColor: colors.foreground,
                      },
                    ]}
                  />
                ))}
              </View>
              <Pressable
                onPress={handleAddFlavor}
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: colors.accent,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add Flavor</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.flavorRow,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                },
              ]}
            >
              {editingFlavor === item.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.foreground,
                        borderColor: colors.input,
                        borderRadius: colors.radius - 2,
                      },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                  />
                  <View style={styles.editColorRow}>
                    {PRESET_COLORS.slice(0, 9).map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setEditColor(c)}
                        style={[
                          styles.colorDotSmall,
                          {
                            backgroundColor: c,
                            borderWidth: c === editColor ? 2 : 0,
                            borderColor: colors.foreground,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.editActions}>
                    <Pressable
                      onPress={handleSaveEdit}
                      style={[
                        styles.editActionBtn,
                        { backgroundColor: colors.accent },
                      ]}
                    >
                      <Feather name="check" size={16} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => setEditingFlavor(null)}
                      style={[
                        styles.editActionBtn,
                        { backgroundColor: colors.mutedForeground },
                      ]}
                    >
                      <Feather name="x" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.flavorRowLeft}>
                    <View
                      style={[
                        styles.flavorDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.flavorName,
                        {
                          color: colors.foreground,
                          opacity: item.active ? 1 : 0.4,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.flavorActions}>
                    <Pressable
                      onPress={() => toggleFlavor(item.id)}
                      style={[
                        styles.iconBtn,
                        {
                          backgroundColor: item.active
                            ? colors.accent
                            : colors.muted,
                        },
                      ]}
                    >
                      <Feather
                        name={item.active ? "eye" : "eye-off"}
                        size={14}
                        color={
                          item.active
                            ? colors.accentForeground
                            : colors.mutedForeground
                        }
                      />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        handleStartEdit(item.id, item.name, item.color)
                      }
                      style={[
                        styles.iconBtn,
                        { backgroundColor: colors.info + "20" },
                      ]}
                    >
                      <Feather name="edit-2" size={14} color={colors.info} />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        handleRemoveFlavor(item.id, item.name)
                      }
                      style={[
                        styles.iconBtn,
                        { backgroundColor: colors.destructive + "20" },
                      ]}
                    >
                      <Feather
                        name="trash-2"
                        size={14}
                        color={colors.destructive}
                      />
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.priceSection}>
          {itemTypes.map((type) => (
            <View
              key={type.id}
              style={[
                styles.priceRow,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text
                style={[styles.priceName, { color: colors.foreground }]}
              >
                {type.name}
              </Text>
              {editingPrice === type.id ? (
                <View style={styles.priceEditRow}>
                  <TextInput
                    style={[
                      styles.priceInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.foreground,
                        borderColor: colors.input,
                        borderRadius: colors.radius - 2,
                      },
                    ]}
                    value={editPriceValue}
                    onChangeText={setEditPriceValue}
                    keyboardType="number-pad"
                  />
                  <Pressable
                    onPress={handleSavePrice}
                    style={[
                      styles.editActionBtn,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Feather name="check" size={16} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingPrice(null)}
                    style={[
                      styles.editActionBtn,
                      { backgroundColor: colors.mutedForeground },
                    ]}
                  >
                    <Feather name="x" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setEditingPrice(type.id);
                    setEditPriceValue(type.price.toString());
                  }}
                  style={styles.priceValueRow}
                >
                  <Text
                    style={[
                      styles.priceValue,
                      { color: colors.primary },
                    ]}
                  >
                    Rs.{type.price}
                  </Text>
                  <Feather
                    name="edit-2"
                    size={14}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
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
  tabBar: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  addSection: {
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  addTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  input: {
    height: 42,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  list: {
    padding: 12,
  },
  flavorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginBottom: 8,
  },
  flavorRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  flavorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  flavorName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  flavorActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  editRow: {
    flex: 1,
    gap: 8,
  },
  editInput: {
    height: 38,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  editColorRow: {
    flexDirection: "row",
    gap: 6,
  },
  colorDotSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  editActions: {
    flexDirection: "row",
    gap: 6,
  },
  editActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  priceSection: {
    padding: 12,
    gap: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  priceName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  priceValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  priceEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceInput: {
    width: 80,
    height: 38,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 1,
    textAlign: "center",
  },
});
