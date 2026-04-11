import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ItemType } from "@/constants/flavors";

interface Props {
  itemType: ItemType;
  quantity: number;
  onPress: () => void;
  onLongPress: () => void;
}

export default function ItemTypeButton({
  itemType,
  quantity,
  onPress,
  onLongPress,
}: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: quantity > 0 ? colors.primary : colors.card,
          borderRadius: colors.radius,
          borderColor: colors.primary,
          borderWidth: 2,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Text
        style={[
          styles.name,
          { color: quantity > 0 ? colors.primaryForeground : colors.primary },
        ]}
      >
        {itemType.name}
      </Text>
      <Text
        style={[
          styles.price,
          {
            color: quantity > 0
              ? colors.primaryForeground
              : colors.mutedForeground,
          },
        ]}
      >
        Rs.{itemType.price}
      </Text>
      {quantity > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
          <Text style={styles.badgeText}>{quantity}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: "relative",
  },
  name: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  price: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
});
