import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { initiateSTKPush, querySTKPushStatus } from "./mpesa";
import { sendOrderStatusNotification } from "./sms";
import { updateOrderPaymentStatus, getOrderByCheckoutRequestId } from "./db";
import { ENV } from "./_core/env";
import {
  createMenuItem,
  createMenuCategory,
  createOrder,
  createRestaurant,
  deleteMenuItem,
  deleteMenuCategory,
  deleteRestaurant,
  getAllMenuItems,
  getAllOrders,
  getDb,
  getMenuCategories,
  getMenuItems,
  getOrderById,
  getOrderItems,
  getOrdersByUserId,
  getOrderWithRestaurant,
  getRestaurantById,
  getRestaurants,
  updateMenuItem,
  updateOrderStatus,
  updateRestaurant,
  getUserNotificationPreferences,
  createOrUpdateNotificationPreferences,
} from "./db";

// ─── Admin Procedure ──────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Restaurants Router ───────────────────────────────────────────────────────

const restaurantsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        cuisine: z.string().optional(),
        featured: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return getRestaurants(input ?? {});
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const restaurant = await getRestaurantById(input.id);
      if (!restaurant) throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant not found" });
      return restaurant;
    }),

  // Admin: create
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        cuisine: z.string().min(1),
        imageUrl: z.string().optional(),
        rating: z.string().optional(),
        deliveryTime: z.string().optional(),
        deliveryFee: z.string().optional(),
        minOrder: z.string().optional(),
        isOpen: z.boolean().optional(),
        featured: z.boolean().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createRestaurant(input);
      return { success: true };
    }),

  // Admin: update
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        cuisine: z.string().optional(),
        imageUrl: z.string().optional(),
        rating: z.string().optional(),
        deliveryTime: z.string().optional(),
        deliveryFee: z.string().optional(),
        minOrder: z.string().optional(),
        isOpen: z.boolean().optional(),
        featured: z.boolean().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateRestaurant(id, data);
      return { success: true };
    }),

  // Admin: delete
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteRestaurant(input.id);
      return { success: true };
    }),
});

// ─── Menu Router ──────────────────────────────────────────────────────────────

const menuRouter = router({
  getCategories: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return getMenuCategories(input.restaurantId);
    }),

  getItems: publicProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return getMenuItems(input.restaurantId);
    }),

  getAllItems: adminProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      return getAllMenuItems(input.restaurantId);
    }),

  createCategory: adminProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        name: z.string().min(1),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createMenuCategory(input);
      return { success: true };
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMenuCategory(input.id);
      return { success: true };
    }),

  createItem: adminProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        categoryId: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string(),
        imageUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
        isPopular: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createMenuItem(input);
      return { success: true };
    }),

  updateItem: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        imageUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
        isPopular: z.boolean().optional(),
        categoryId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateMenuItem(id, data);
      return { success: true };
    }),

  deleteItem: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMenuItem(input.id);
      return { success: true };
    }),
});

// ─── Orders Router ────────────────────────────────────────────────────────────

const ordersRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        items: z.array(
          z.object({
            menuItemId: z.number(),
            name: z.string(),
            price: z.string(),
            quantity: z.number().min(1),
          })
        ),
        deliveryAddress: z.string().min(1),
        deliveryName: z.string().optional(),
        deliveryPhone: z.string().optional(),
        notes: z.string().optional(),
        totalAmount: z.string(),
        deliveryFee: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const orderId = await createOrder(
        {
          userId: ctx.user.id,
          restaurantId: input.restaurantId,
          totalAmount: input.totalAmount,
          deliveryFee: input.deliveryFee ?? "2.99",
          deliveryAddress: input.deliveryAddress,
          deliveryName: input.deliveryName,
          deliveryPhone: input.deliveryPhone,
          notes: input.notes,
          estimatedDelivery: "30-45 min",
          status: "placed",
        },
        input.items.map((item) => ({
          orderId: 0, // will be replaced
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))
      );
      return { orderId };
    }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return getOrdersByUserId(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const orderWithRestaurant = await getOrderWithRestaurant(input.id);
      if (!orderWithRestaurant) throw new TRPCError({ code: "NOT_FOUND" });
      if (orderWithRestaurant.order.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const items = await getOrderItems(input.id);
      return { ...orderWithRestaurant, items };
    }),

  // Admin: list all orders
  adminList: adminProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return getAllOrders(input?.limit ?? 50, input?.offset ?? 0);
    }),

  // Admin: update status
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["placed", "preparing", "on_the_way", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateOrderStatus(input.id, input.status);

      if (input.status === "on_the_way" || input.status === "delivered") {
        try {
          const order = await getOrderWithRestaurant(input.id);
          if (order && order.order.deliveryPhone) {
            const restaurant = order.restaurant;
            await sendOrderStatusNotification({
              phoneNumber: order.order.deliveryPhone,
              orderId: input.id,
              status: input.status,
              restaurantName: restaurant?.name || "Your Restaurant",
              estimatedTime: order.order.estimatedDelivery ?? undefined,
              userId: order.order.userId,
            });
          }
        } catch (error) {
          console.error("Failed to send SMS notification:", error);
        }
      }

      return { success: true };
    }),

  // M-Pesa: Initiate payment
  initiatePayment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        phoneNumber: z.string(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const order = await getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const callbackUrl = ENV.mpesaCallbackUrl || "https://example.com/api/mpesa/callback";

      const result = await initiateSTKPush({
        phoneNumber: input.phoneNumber,
        amount: input.amount,
        accountReference: `ORDER${input.orderId}`,
        transactionDescription: `Food Bites Order #${input.orderId}`,
        callbackUrl,
      });

      if (result.responseCode === "0") {
        await updateOrderPaymentStatus(
          input.orderId,
          "processing",
          undefined,
          result.checkoutRequestId
        );
      }

      return result;
    }),

  // M-Pesa: Query payment status
  queryPaymentStatus: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      const order = await getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!order.mpesaCheckoutRequestId) {
        return { status: "pending", message: "Payment not initiated" };
      }

      const result = await querySTKPushStatus({
        checkoutRequestId: order.mpesaCheckoutRequestId,
      });

      return result;
    }),
});

// ─── Seed Router ────────────────────────────────────────────────────────────────

const seedRouter = router({
  populate: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return { success: true, message: "Seed endpoint ready" };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  restaurants: restaurantsRouter,
  menu: menuRouter,
  orders: ordersRouter,
  seed: seedRouter,
  notifications: router({
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      return getUserNotificationPreferences(ctx.user.id);
    }),
    updatePreferences: protectedProcedure
      .input(
        z.object({
          smsOnOrderOnTheWay: z.boolean().optional(),
          smsOnOrderDelivered: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createOrUpdateNotificationPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
