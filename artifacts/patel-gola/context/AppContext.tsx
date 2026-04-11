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
  createOrder: (items: OrderItem[]) => void;
  addItemsToOrder: (orderId: string, items: OrderItem[]) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  completeOrder: (orderId: string) => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [flavors, setFlavors] = useState<Flavor[]>(DEFAULT_FLAVORS);
  const [itemTypes, setItemTypes] = useState<ItemType[]>(DEFAULT_ITEM_TYPES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedFlavors, storedItemTypes, storedOrders] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.FLAVORS),
            AsyncStorage.getItem(STORAGE_KEYS.ITEM_TYPES),
            AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
          ]);
        if (storedFlavors) setFlavors(JSON.parse(storedFlavors));
        if (storedItemTypes) setItemTypes(JSON.parse(storedItemTypes));
        if (storedOrders) setOrders(JSON.parse(storedOrders));
      } catch {
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
    setFlavors((prev) => [...prev, { id: generateId(), name, color, active: true }]);
  }, []);

  const removeFlavor = useCallback((id: string) => {
    setFlavors((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFlavor = useCallback((id: string, name: string, color: string) => {
    setFlavors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name, color } : f))
    );
  }, []);

  const toggleFlavor = useCallback((id: string) => {
    setFlavors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
    );
  }, []);

  const updateItemTypePrice = useCallback((id: string, price: number) => {
    setItemTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, price } : t))
    );
  }, []);

  const createOrder = useCallback((items: OrderItem[]) => {
    const newOrder: Order = {
      id: generateId(),
      items,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setOrders((prev) => [newOrder, ...prev]);
  }, []);

  const addItemsToOrder = useCallback(
    (orderId: string, items: OrderItem[]) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, items: [...o.items, ...items] } : o
        )
      );
    },
    []
  );

  const removeItemFromOrder = useCallback(
    (orderId: string, itemId: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, items: o.items.filter((i) => i.id !== itemId) }
            : o
        )
      );
    },
    []
  );

  const completeOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, completed: true } : o
      )
    );
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const getOrderTotal = useCallback(
    (order: Order): number => {
      return order.items.reduce((total, item) => {
        const itemType = itemTypes.find((t) => t.id === item.typeId);
        return total + (itemType?.price ?? 0) * item.quantity;
      }, 0);
    },
    [itemTypes]
  );

  const getDailyOrders = useCallback(
    (date: string): Order[] => {
      return orders.filter((o) => o.createdAt.startsWith(date));
    },
    [orders]
  );

  const today = getDateKey(new Date());
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + getOrderTotal(o),
    0
  );
  const todayOrderCount = todayOrders.length;

  const exportWeeklyData = useCallback((): string => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter(
      (o) => new Date(o.createdAt) >= weekAgo
    );

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

    Object.keys(grouped)
      .sort()
      .forEach((date) => {
        const dayOrders = grouped[date];
        const dayTotal = dayOrders.reduce((s, o) => s + getOrderTotal(o), 0);
        text += `--- ${date} (${dayOrders.length} orders, Rs.${dayTotal}) ---\n`;
        dayOrders.forEach((o, idx) => {
          text += `  Order #${idx + 1} (${new Date(o.createdAt).toLocaleTimeString()}):\n`;
          o.items.forEach((item) => {
            const type = itemTypes.find((t) => t.id === item.typeId);
            const flavorNames = item.flavorIds
              .map((fid) => flavors.find((f) => f.id === fid)?.name ?? fid)
              .join(", ");
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
    setOrders((prev) =>
      prev.filter((o) => new Date(o.createdAt) >= weekAgo)
    );
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
