import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cuisine: varchar("cuisine", { length: 100 }).notNull(),
  imageUrl: text("imageUrl"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: int("reviewCount").default(0),
  deliveryTime: varchar("deliveryTime", { length: 50 }).default("30-45 min"),
  deliveryFee: decimal("deliveryFee", { precision: 6, scale: 2 }).default("2.99"),
  minOrder: decimal("minOrder", { precision: 6, scale: 2 }).default("10.00"),
  isOpen: boolean("isOpen").default(true),
  featured: boolean("featured").default(false),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;

export const menuCategories = mysqlTable("menu_categories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  sortOrder: int("sortOrder").default(0),
});

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;

export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true),
  isPopular: boolean("isPopular").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  status: mysqlEnum("status", ["placed", "preparing", "on_the_way", "delivered", "cancelled"])
    .default("placed")
    .notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "processing", "completed", "failed"])
    .default("pending")
    .notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).default("mpesa"),
  mpesaTransactionId: varchar("mpesaTransactionId", { length: 100 }),
  mpesaCheckoutRequestId: varchar("mpesaCheckoutRequestId", { length: 100 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 6, scale: 2 }).default("2.99"),
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryName: varchar("deliveryName", { length: 255 }),
  deliveryPhone: varchar("deliveryPhone", { length: 50 }),
  notes: text("notes"),
  estimatedDelivery: varchar("estimatedDelivery", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  menuItemId: int("menuItemId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 8, scale: 2 }).notNull(),
  quantity: int("quantity").notNull().default(1),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
