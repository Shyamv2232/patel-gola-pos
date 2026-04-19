import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const flavors = pgTable("flavors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const itemTypes = pgTable("item_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  completed: boolean("completed").default(false).notNull(),
  paymentMode: text("payment_mode"),
  customerName: text("customer_name"),
  finalAmount: integer("final_amount"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .references(() => orders.id)
    .notNull(),
  typeId: text("type_id")
    .references(() => itemTypes.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  flavorIds: text("flavor_ids").array().notNull(),
});