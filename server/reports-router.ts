import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";

export const reportsRouter = router({
  financialSummary: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        };
      }

      try {
        // Fetch all orders
        const allOrders = await db.select().from(orders);

        let filteredOrders = allOrders;

        // Filter by date range if provided
        if (input.startDate || input.endDate) {
          filteredOrders = allOrders.filter((order) => {
            const orderDate = new Date(order.createdAt);
            if (input.startDate && orderDate < input.startDate) return false;
            if (input.endDate && orderDate > input.endDate) return false;
            return true;
          });
        }

        const totalRevenue = filteredOrders.reduce((sum, order) => {
          return sum + parseFloat(order.totalAmount || "0");
        }, 0);

        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalOrders,
          avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        };
      } catch (error) {
        console.error("[Reports] Failed to fetch financial summary:", error);
        return {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        };
      }
    }),

  dailyRevenue: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const allOrders = await db.select().from(orders);

        const dailyData: Record<string, number> = {};

        allOrders.forEach((order) => {
          const date = new Date(order.createdAt);
          const dateStr = date.toISOString().split("T")[0];

          if (input.startDate && date < input.startDate) return;
          if (input.endDate && date > input.endDate) return;

          const revenue = parseFloat(order.totalAmount || "0");
          dailyData[dateStr] = (dailyData[dateStr] || 0) + revenue;
        });

        return Object.entries(dailyData)
          .map(([date, revenue]) => ({
            date,
            revenue: parseFloat(revenue.toFixed(2)),
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } catch (error) {
        console.error("[Reports] Failed to fetch daily revenue:", error);
        return [];
      }
    }),

  ordersByStatus: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        placed: 0,
        preparing: 0,
        on_the_way: 0,
        delivered: 0,
        cancelled: 0,
      };
    }

    try {
      const allOrders = await db.select().from(orders);

      const statusCounts: Record<string, number> = {
        placed: 0,
        preparing: 0,
        on_the_way: 0,
        delivered: 0,
        cancelled: 0,
      };

      allOrders.forEach((order) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      return statusCounts;
    } catch (error) {
      console.error("[Reports] Failed to fetch orders by status:", error);
      return {
        placed: 0,
        preparing: 0,
        on_the_way: 0,
        delivered: 0,
        cancelled: 0,
      };
    }
  }),

  paymentMethodBreakdown: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};

    try {
      const allOrders = await db.select().from(orders);

      const methodCounts: Record<string, number> = {};

      allOrders.forEach((order) => {
        const method = order.paymentMethod || "unknown";
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      });

      return methodCounts;
    } catch (error) {
      console.error("[Reports] Failed to fetch payment method breakdown:", error);
      return {};
    }
  }),
});
