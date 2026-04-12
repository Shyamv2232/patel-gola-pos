import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import OrderCard from "@/components/OrderCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    completedOrders,
    getDailyOrders,
    getOrderTotal,
    exportWeeklyData,
    clearOldData,
  } = useApp();

  const today = getDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(getDateKey(d));
  }

  const dayOrders = getDailyOrders(selectedDate).filter((o) => o.completed);
  const dayRevenue = dayOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data = exportWeeklyData();
    if (Platform.OS === "web") {
      const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `patel-gola-weekly-report-${getDateKey(new Date())}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      try {
        await Share.share({ message: data, title: "Patel Gola Weekly Report" });
      } catch {
        Alert.alert("Export", "Could not share the report.");
      }
    }
  };

  const handleClearOld = () => {
    if (Platform.OS === "web") {
      if (window.confirm("This will remove all orders older than 7 days. Continue?")) {
        clearOldData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert(
        "Clear Old Data",
        "This will remove all orders older than 7 days. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear",
            style: "destructive",
            onPress: () => {
              clearOldData();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            },
          },
        ]
      );
    }
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
        <Text style={styles.title}>Order History</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleExport} style={styles.headerBtn}>
            <Feather name="share" size={18} color="#fff" />
            <Text style={styles.headerBtnText}>Export</Text>
          </Pressable>
          <Pressable onPress={handleClearOld} style={styles.headerBtn}>
            <Feather name="trash" size={18} color="#fff" />
            <Text style={styles.headerBtnText}>Clear Old</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.dateBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={last7Days}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.dateList}
          renderItem={({ item }) => {
            const isSelected = item === selectedDate;
            const dayCount = getDailyOrders(item).filter(
              (o) => o.completed
            ).length;
            return (
              <Pressable
                onPress={() => setSelectedDate(item)}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.card,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateChipText,
                    {
                      color: isSelected
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {formatDate(item)}
                </Text>
                <Text
                  style={[
                    styles.dateChipCount,
                    {
                      color: isSelected
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {dayCount}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <View
        style={[
          styles.summaryBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.summaryText, { color: colors.foreground }]}>
          {dayOrders.length} orders
        </Text>
        <Text style={[styles.summaryRevenue, { color: colors.primary }]}>
          Rs.{dayRevenue}
        </Text>
      </View>

      {dayOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather
            name="calendar"
            size={48}
            color={colors.mutedForeground}
          />
          <Text
            style={[styles.emptyText, { color: colors.mutedForeground }]}
          >
            No completed orders
          </Text>
        </View>
      ) : (
        <FlatList
          data={dayOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => {}} showActions={false} />
          )}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={dayOrders.length > 0}
        />
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
  headerActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 10,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff20",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dateBar: {
    paddingVertical: 10,
  },
  dateList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  dateChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dateChipCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  summaryRevenue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  list: {
    padding: 12,
  },
});
