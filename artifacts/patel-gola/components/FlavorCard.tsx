import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Flavor } from "@/constants/flavors";

interface Props {
  flavor: Flavor;
  selected: boolean;
  onPress: () => void;
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#1a1a2e" : "#ffffff";
}

export default function FlavorCard({ flavor, selected, onPress }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const textColor = getContrastColor(flavor.color);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: flavor.color,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        selected && styles.selected,
      ]}
    >
      <Text style={[styles.name, { color: textColor }]}>{flavor.name}</Text>
      {selected && (
        <View style={styles.checkBadge}>
          <Feather name="check" size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "30%",
    aspectRatio: 1.2,
    justifyContent: "center",
    alignItems: "center",
    margin: "1.5%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  selected: {
    borderWidth: 3,
    borderColor: "#1a1a2e",
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
});
