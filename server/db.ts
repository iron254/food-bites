import { and, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  menuCategories,
  menuItems,
  orderItems,
  orders,
  restaurants,
  users,
  userNotificationPreferences,
  smsLogs,
  bookmarks,
  type InsertMenuItem,
  type InsertOrder,
  type InsertOrderItem,
  type InsertRestaurant,
  type InsertMenuCategory,
  type InsertSmsLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Restaurants ──────────────────────────────────────────────────────────────

export async function getRestaurants(opts?: {
  search?: string;
  cuisine?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (opts?.search) {
    conditions.push(
      or(
        like(restaurants.name, `%${opts.search}%`),
        like(restaurants.cuisine, `%${opts.search}%`)
      )
    );
  }
  if (opts?.cuisine && opts.cuisine !== "All") {
    conditions.push(like(restaurants.cuisine, `%${opts.cuisine}%`));
  }
  if (opts?.featured !== undefined) {
    conditions.push(eq(restaurants.featured, opts.featured));
  }

  const query = db
    .select()
    .from(restaurants)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(restaurants.rating))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);

  return query;
}

export async function getRestaurantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  return result[0];
}

export async function createRestaurant(data: InsertRestaurant) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(restaurants).values(data);
  return result;
}

export async function updateRestaurant(id: number, data: Partial<InsertRestaurant>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(restaurants).set(data).where(eq(restaurants.id, id));
}

export async function deleteRestaurant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(restaurants).where(eq(restaurants.id, id));
}

// ─── Menu Categories ──────────────────────────────────────────────────────────

export async function getMenuCategories(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.restaurantId, restaurantId))
    .orderBy(menuCategories.sortOrder);
}

export async function createMenuCategory(data: InsertMenuCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(menuCategories).values(data);
  return result;
}

export async function deleteMenuCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(menuCategories).where(eq(menuCategories.id, id));
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export async function getMenuItems(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.isAvailable, true)))
    .orderBy(menuItems.categoryId);
}

export async function getAllMenuItems(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurantId))
    .orderBy(menuItems.categoryId);
}

export async function getMenuItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  return result[0];
}

export async function createMenuItem(data: InsertMenuItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(menuItems).values(data);
  return result;
}

export async function updateMenuItem(id: number, data: Partial<InsertMenuItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(menuItems).set(data).where(eq(menuItems.id, id));
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(
  orderData: InsertOrder,
  items: InsertOrderItem[]
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const result = await db.insert(orders).values(orderData);
  const orderId = (result as any)[0]?.insertId as number;

  if (items.length > 0) {
    await db.insert(orderItems).values(items.map((item) => ({ ...item, orderId })));
  }

  return orderId;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderStatus(
  id: number,
  status: "placed" | "preparing" | "on_the_way" | "delivered" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getAllOrders(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      order: orders,
      userName: users.name,
      restaurantName: restaurants.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getOrderWithRestaurant(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      order: orders,
      restaurant: restaurants,
    })
    .from(orders)
    .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
    .where(eq(orders.id, orderId))
    .limit(1);
  return result[0];
}

// ─── Payment Management ────────────────────────────────────────────────────────

export async function updateOrderPaymentStatus(
  id: number,
  paymentStatus: "pending" | "processing" | "completed" | "failed",
  mpesaTransactionId?: string,
  mpesaCheckoutRequestId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  const updateData: any = { paymentStatus };
  if (mpesaTransactionId) updateData.mpesaTransactionId = mpesaTransactionId;
  if (mpesaCheckoutRequestId) updateData.mpesaCheckoutRequestId = mpesaCheckoutRequestId;
  
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

export async function getOrderByCheckoutRequestId(checkoutRequestId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.mpesaCheckoutRequestId, checkoutRequestId))
    .limit(1);
  return result[0];
}

// ─── SMS Logs & Notification Preferences ──────────────────────────────────────

export async function logSMS(data: InsertSmsLog) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(smsLogs).values(data);
  } catch (error) {
    console.error("[Database] Failed to log SMS:", error);
  }
}

export async function getUserNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get notification preferences:", error);
    return null;
  }
}

export async function createOrUpdateNotificationPreferences(
  userId: number,
  prefs: { smsOnOrderOnTheWay?: boolean; smsOnOrderDelivered?: boolean }
) {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = await getUserNotificationPreferences(userId);
    if (existing) {
      await db
        .update(userNotificationPreferences)
        .set({
          smsOnOrderOnTheWay: prefs.smsOnOrderOnTheWay ?? existing.smsOnOrderOnTheWay,
          smsOnOrderDelivered: prefs.smsOnOrderDelivered ?? existing.smsOnOrderDelivered,
        })
        .where(eq(userNotificationPreferences.userId, userId));
    } else {
      await db.insert(userNotificationPreferences).values({
        userId,
        smsOnOrderOnTheWay: prefs.smsOnOrderOnTheWay ?? true,
        smsOnOrderDelivered: prefs.smsOnOrderDelivered ?? true,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to update notification preferences:", error);
  }
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function addBookmark(userId: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  // Check if bookmark already exists
  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.restaurantId, restaurantId)))
    .limit(1);
  
  if (existing.length > 0) {
    return; // Already bookmarked
  }
  
  await db.insert(bookmarks).values({ userId, restaurantId });
}

export async function removeBookmark(userId: number, restaurantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.restaurantId, restaurantId)));
}

export async function isRestaurantBookmarked(userId: number, restaurantId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.restaurantId, restaurantId)))
    .limit(1);
  return result.length > 0;
}

export async function getBookmarkedRestaurants(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ restaurant: restaurants })
    .from(bookmarks)
    .leftJoin(restaurants, eq(bookmarks.restaurantId, restaurants.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}
