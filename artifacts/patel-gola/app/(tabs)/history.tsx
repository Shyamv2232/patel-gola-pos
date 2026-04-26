import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  TextInput,
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
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(getDateKey(d));
  }

  const dayOrders = getDailyOrders(selectedDate).filter((o) => o.completed);
  const dayRevenue = dayOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const cashRevenue = dayOrders
    .filter((o) => o.paymentMode === "cash")
    .reduce((s, o) => s + getOrderTotal(o), 0);
  const onlineRevenue = dayOrders
    .filter((o) => o.paymentMode === "online")
    .reduce((s, o) => s + getOrderTotal(o), 0);

  // Reset authorization when tab loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsAuthorized(false);
      };
    }, [])
  );

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data = exportWeeklyData();
    if (Platform.OS === "web") {
      try {
        await navigator.clipboard.writeText(data);
        window.alert("Export copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
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
      setShowConfirmClear(true);
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

  const confirmWebClear = () => {
    clearOldData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfirmClear(false);
    window.alert("Old data cleared!");
  };

  const handlePinSubmit = () => {
    if (pinInput === "2709") {
      setIsAuthorized(true);
      setShowPinModal(false);
      setPinInput("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert("Error", "Incorrect PIN");
      setPinInput("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            {dayOrders.length} orders
          </Text>
          <View style={styles.revenueCategories}>
            <View style={styles.categoryItem}>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>Cash:</Text>
              <Text style={[styles.categoryValue, { color: "#22c55e" }]}>
                {isAuthorized ? `Rs.${cashRevenue}` : "****"}
              </Text>
            </View>
            <View style={styles.categoryItem}>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>Online:</Text>
              <Text style={[styles.categoryValue, { color: colors.info }]}>
                {isAuthorized ? `Rs.${onlineRevenue}` : "****"}
              </Text>
            </View>
          </View>
        </View>
        <Pressable 
          onPress={() => !isAuthorized && setShowPinModal(true)}
          style={styles.totalContainer}
        >
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
          <Text style={[styles.summaryRevenue, { color: colors.primary }]}>
            {isAuthorized ? `Rs.${dayRevenue}` : "****"}
          </Text>
        </Pressable>
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
            <OrderCard
              order={item}
              onPress={() => { }}
              showActions={false}
              hideTotal={!isAuthorized}
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
          scrollEnabled={dayOrders.length > 0}
        />
      )}

      {showConfirmClear && (
        <View style={styles.webConfirmOverlay}>
          <View style={[styles.webConfirmBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.webConfirmTitle, { color: colors.foreground }]}>Clear Old Data</Text>
            <Text style={[styles.webConfirmText, { color: colors.mutedForeground }]}>This will remove all orders older than 7 days. Continue?</Text>
            <View style={styles.webConfirmActions}>
              <Pressable onPress={() => setShowConfirmClear(false)} style={[styles.webConfirmBtn, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.foreground }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmWebClear} style={[styles.webConfirmBtn, { backgroundColor: "#ef4444" }]}>
                <Text style={{ color: "#fff" }}>Clear</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {showPinModal && (
        <View style={styles.webConfirmOverlay}>
          <View style={[styles.webConfirmBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.webConfirmTitle, { color: colors.foreground }]}>Admin Authorization</Text>
            <Text style={[styles.webConfirmText, { color: colors.mutedForeground }]}>Enter PIN to view revenue data.</Text>
            <TextInput
              style={[styles.pinInput, { color: colors.foreground, borderColor: colors.border }]}
              keyboardType="number-pad"
              secureTextEntry
              autoFocus
              value={pinInput}
              onChangeText={setPinInput}
              onSubmitEditing={handlePinSubmit}
            />
            <View style={styles.webConfirmActions}>
              <Pressable onPress={() => setShowPinModal(false)} style={[styles.webConfirmBtn, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.foreground }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handlePinSubmit} style={[styles.webConfirmBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: colors.primaryForeground }}>Unlock</Text>
              </Pressable>
            </View>
          </View>
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
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  revenueCategories: {
    flexDirection: "row",
    gap: 12,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  categoryValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  summaryRevenue: {
    fontSize: 20,
    fontFamily: "Inter_800ExtraBold",
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
  webConfirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  webConfirmBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    width: "80%",
    maxWidth: 400,
  },
  webConfirmTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  webConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  webConfirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  webConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 4,
  },
});
