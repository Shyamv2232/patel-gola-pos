import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_FLAVORS,
  DEFAULT_ITEM_TYPES,
  type Flavor,
  type ItemType,
  type Order,
  type OrderItem,
  type PaymentMode,
} from "@/constants/flavors";

interface AppContextType {
  flavors: Flavor[];
  itemTypes: ItemType[];
  activeOrders: Order[];
  completedOrders: Order[];
  addFlavor: (name: string, color: string) => void;
  removeFlavor: (id: string) => void;
  updateFlavor: (id: string, name: string, color: string) => void;
  toggleFlavor: (id: string) => void;
  updateItemTypePrice: (id: string, price: number) => void;
  createOrder: (items: OrderItem[], customerName?: string) => void;
  addItemsToOrder: (orderId: string, items: OrderItem[]) => void;
  updateItemInOrder: (orderId: string, item: OrderItem) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  completeOrder: (orderId: string, paymentMode: PaymentMode, finalAmount?: number) => void;
  deleteOrder: (orderId: string) => void;
  getOrderTotal: (order: Order) => number;
  getDailyOrders: (date: string) => Order[];
  exportWeeklyData: () => string;
  clearOldData: () => void;
  todayRevenue: number;
  todayOrderCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  FLAVORS: "@patelgola_flavors",
  ITEM_TYPES: "@patelgola_item_types",
  ORDERS: "@patelgola_orders",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Custom API fetcher
const API_URL = "/api";
async function api(path: string, options?: RequestInit) {
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`API Request failed for ${url}:`, text);
      throw new Error(`API Request failed: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Network or API error at ${url}:`, err);
    throw err;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [flavors, setFlavors] = useState<Flavor[]>(DEFAULT_FLAVORS);
  const [itemTypes, setItemTypes] = useState<ItemType[]>(DEFAULT_ITEM_TYPES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load local cache quickly
        const [storedFlavors, storedItemTypes, storedOrders] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.FLAVORS),
          AsyncStorage.getItem(STORAGE_KEYS.ITEM_TYPES),
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
        ]);
        if (storedFlavors) setFlavors(JSON.parse(storedFlavors));
        if (storedItemTypes) setItemTypes(JSON.parse(storedItemTypes));
        if (storedOrders) setOrders(JSON.parse(storedOrders));

        // Sync with PostgreSQL Backend
        const data = await api("/data");
        if (data.flavors && data.flavors.length > 0) setFlavors(data.flavors);
        if (data.itemTypes && data.itemTypes.length > 0) setItemTypes(data.itemTypes);
        if (data.orders) setOrders(data.orders);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.FLAVORS, JSON.stringify(flavors));
  }, [flavors, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.ITEM_TYPES, JSON.stringify(itemTypes));
  }, [itemTypes, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders, loaded]);

  const addFlavor = useCallback((name: string, color: string) => {
    const newFlavor = { id: generateId(), name, color, active: true };
    setFlavors((prev) => [...prev, newFlavor]);
    api("/flavors", { method: "POST", body: JSON.stringify(newFlavor) }).catch(console.error);
  }, []);

  const removeFlavor = useCallback((id: string) => {
    setFlavors((prev) => prev.filter((f) => f.id !== id));
    api(`/flavors/${id}`, { method: "DELETE" }).catch(console.error);
  }, []);

  const updateFlavor = useCallback((id: string, name: string, color: string) => {
    setFlavors((prev) => prev.map((f) => (f.id === id ? { ...f, name, color } : f)));
    api(`/flavors/${id}`, { method: "PUT", body: JSON.stringify({ name, color }) }).catch(console.error);
  }, []);

  const toggleFlavor = useCallback((id: string) => {
    setFlavors((prev) => {
      const flavor = prev.find(f => f.id === id);
      if (flavor) {
        api(`/flavors/${id}`, { method: "PUT", body: JSON.stringify({ active: !flavor.active }) }).catch(console.error);
      }
      return prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
    });
  }, []);

  const updateItemTypePrice = useCallback((id: string, price: number) => {
    setItemTypes((prev) => prev.map((t) => (t.id === id ? { ...t, price } : t)));
    api(`/itemTypes/${id}`, { method: "PUT", body: JSON.stringify({ price }) }).catch(console.error);
  }, []);

  const createOrder = useCallback((items: OrderItem[], customerName?: string) => {
    const newOrder: Order = {
      id: generateId(),
      items,
      createdAt: new Date().toISOString(),
      completed: false,
      customerName,
    };
    setOrders((prev) => [newOrder, ...prev]);
    api("/orders", { method: "POST", body: JSON.stringify(newOrder) }).catch(console.error);
  }, []);

  const addItemsToOrder = useCallback((orderId: string, items: OrderItem[]) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, items: [...o.items, ...items] } : o));
    api(`/orders/${orderId}/items`, { method: "POST", body: JSON.stringify({ items }) }).catch(console.error);
  }, []);

  const updateItemInOrder = useCallback((orderId: string, item: OrderItem) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, items: o.items.map((existing) => existing.id === item.id ? item : existing) } : o));
    api(`/orders/${orderId}/items/${item.id}`, { method: "PUT", body: JSON.stringify(item) }).catch(console.error);
  }, []);

  const removeItemFromOrder = useCallback((orderId: string, itemId: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, items: o.items.filter((i) => i.id !== itemId) } : o));
    api(`/orders/${orderId}/items/${itemId}`, { method: "DELETE" }).catch(console.error);
  }, []);

  const completeOrder = useCallback((orderId: string, paymentMode: PaymentMode, finalAmount?: number) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, completed: true, paymentMode, finalAmount } : o));
    api(`/orders/${orderId}/complete`, { method: "PUT", body: JSON.stringify({ paymentMode, finalAmount }) }).catch(console.error);
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    api(`/orders/${orderId}`, { method: "DELETE" }).catch(console.error);
  }, []);

  const getOrderTotal = useCallback((order: Order): number => {
    if (order.finalAmount !== undefined) return order.finalAmount;
    return order.items.reduce((total, item) => {
      const itemType = itemTypes.find((t) => t.id === item.typeId);
      return total + (itemType?.price ?? 0) * item.quantity;
    }, 0);
  }, [itemTypes]);

  const getDailyOrders = useCallback((date: string): Order[] => {
    return orders.filter((o) => o.createdAt.startsWith(date));
  }, [orders]);

  const today = getDateKey(new Date());
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const todayOrderCount = todayOrders.length;

  const exportWeeklyData = useCallback((): string => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter((o) => new Date(o.createdAt) >= weekAgo);

    let text = `=== PATEL GOLA - Weekly Report ===\n`;
    text += `Period: ${getDateKey(weekAgo)} to ${getDateKey(now)}\n`;
    text += `Total Orders: ${weekOrders.length}\n`;
    text += `Total Revenue: Rs.${weekOrders.reduce((s, o) => s + getOrderTotal(o), 0)}\n\n`;

    const grouped: Record<string, Order[]> = {};
    weekOrders.forEach((o) => {
      const key = o.createdAt.split("T")[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(o);
    });

    Object.keys(grouped).sort().forEach((date) => {
      const dayOrders = grouped[date];
      const dayTotal = dayOrders.reduce((s, o) => s + getOrderTotal(o), 0);
      text += `--- ${date} (${dayOrders.length} orders, Rs.${dayTotal}) ---\n`;
      dayOrders.forEach((o, idx) => {
        text += `  Order #${idx + 1} (${new Date(o.createdAt).toLocaleTimeString()})${o.customerName ? ` - ${o.customerName}` : ""}:\n`;
        text += `    Payment: ${o.paymentMode === "online" ? "Online" : o.paymentMode === "cash" ? "Cash" : "Not selected"}\n`;
        o.items.forEach((item) => {
          const type = itemTypes.find((t) => t.id === item.typeId);
          const flavorNames = item.flavorIds.map((fid) => flavors.find((f) => f.id === fid)?.name ?? fid).join(", ");
          text += `    ${type?.name ?? item.typeId} x${item.quantity} - ${flavorNames} = Rs.${(type?.price ?? 0) * item.quantity}\n`;
        });
        text += `    Total: Rs.${getOrderTotal(o)}\n`;
      });
      text += `\n`;
    });

    return text;
  }, [orders, itemTypes, flavors, getOrderTotal]);

  const clearOldData = useCallback(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    setOrders((prev) => prev.filter((o) => new Date(o.createdAt) >= weekAgo));
    api("/clearOld", { method: "POST" }).catch(console.error);
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        flavors,
        itemTypes,
        activeOrders: orders.filter((o) => !o.completed),
        completedOrders: orders.filter((o) => o.completed),
        addFlavor,
        removeFlavor,
        updateFlavor,
        toggleFlavor,
        updateItemTypePrice,
        createOrder,
        addItemsToOrder,
        updateItemInOrder,
        removeItemFromOrder,
        completeOrder,
        deleteOrder,
        getOrderTotal,
        getDailyOrders,
        exportWeeklyData,
        clearOldData,
        todayRevenue,
        todayOrderCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
