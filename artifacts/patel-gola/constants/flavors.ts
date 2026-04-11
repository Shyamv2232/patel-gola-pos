export interface Flavor {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

export const DEFAULT_FLAVORS: Flavor[] = [
  { id: "blueberry", name: "Blue Berry", color: "#4361ee", active: true },
  { id: "butterscotch", name: "Butter Scotch", color: "#e6a817", active: true },
  { id: "chocolate", name: "Chocolate", color: "#7b3f00", active: true },
  { id: "falsa", name: "Falsa", color: "#6a0dad", active: true },
  { id: "jamun", name: "Jamun", color: "#4a0e4e", active: true },
  { id: "kalakhatta", name: "Kala Khatta", color: "#2d1b69", active: true },
  { id: "kachikeri", name: "Kachi Keri", color: "#a8c256", active: true },
  { id: "mango", name: "Mango", color: "#ffb347", active: true },
  { id: "mavamalai", name: "Mava Malai", color: "#f5e6ca", active: true },
  { id: "orange", name: "Orange", color: "#ff8c00", active: true },
  { id: "pineapple", name: "Pineapple", color: "#f7dc6f", active: true },
  { id: "rose", name: "Rose", color: "#ff69b4", active: true },
  { id: "rajbhog", name: "Rajbhog", color: "#daa520", active: true },
  { id: "strawberry", name: "Strawberry", color: "#ff4757", active: true },
  { id: "vanilla", name: "Vanilla", color: "#f3e5ab", active: true },
];

export interface ItemType {
  id: string;
  name: string;
  price: number;
}

export const DEFAULT_ITEM_TYPES: ItemType[] = [
  { id: "stick", name: "Stick", price: 40 },
  { id: "special_stick", name: "Special Stick", price: 60 },
  { id: "dish", name: "Dish", price: 100 },
  { id: "special_dish", name: "Special Dish", price: 170 },
];

export interface OrderItem {
  id: string;
  flavorIds: string[];
  typeId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  createdAt: string;
  completed: boolean;
}
