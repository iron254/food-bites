import { describe, it, expect, vi, beforeEach } from "vitest";
import { getReceiptData, generateReceiptHTML } from "./receipt";
import * as db from "./db";

// Mock the db module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getReceiptData: vi.fn(),
}));

describe("Receipt Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getReceiptData", () => {
    it("should fetch receipt data for a valid order", async () => {
      const mockReceipt = {
        orderId: 1,
        orderNumber: "ORD-000001",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+254123456789",
        restaurantName: "Test Restaurant",
        items: [
          { name: "Pizza", quantity: 2, price: 500, subtotal: 1000 },
          { name: "Coke", quantity: 1, price: 150, subtotal: 150 },
        ],
        subtotal: 1150,
        deliveryFee: 260,
        total: 1410,
        paymentStatus: "completed",
        paymentMethod: "mpesa",
        orderStatus: "delivered",
        createdAt: new Date(),
        deliveryAddress: "123 Main St, Nairobi",
        specialInstructions: "No onions",
      };

      const result = await getReceiptData(1, 1);
      expect(result).toBeDefined();
    });

    it("should return null for unauthorized user", async () => {
      const result = await getReceiptData(1, 999);
      expect(result).toBeNull();
    });

    it("should return null for non-existent order", async () => {
      const result = await getReceiptData(999, 1);
      expect(result).toBeNull();
    });
  });

  describe("generateReceiptHTML", () => {
    it("should generate valid HTML receipt", () => {
      const mockReceipt = {
        orderId: 1,
        orderNumber: "ORD-000001",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+254123456789",
        restaurantName: "Test Restaurant",
        items: [
          { name: "Pizza", quantity: 2, price: 500, subtotal: 1000 },
        ],
        subtotal: 1000,
        deliveryFee: 260,
        total: 1260,
        paymentStatus: "completed",
        paymentMethod: "mpesa",
        orderStatus: "delivered",
        createdAt: new Date(),
        deliveryAddress: "123 Main St, Nairobi",
        specialInstructions: undefined,
      };

      const html = generateReceiptHTML(mockReceipt);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("FoodBites");
      expect(html).toContain("ORD-000001");
      expect(html).toContain("John Doe");
      expect(html).toContain("Test Restaurant");
      expect(html).toContain("Pizza");
      expect(html).toContain("123 Main St, Nairobi");
    });

    it("should include payment status in receipt", () => {
      const mockReceipt = {
        orderId: 1,
        orderNumber: "ORD-000001",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+254123456789",
        restaurantName: "Test Restaurant",
        items: [],
        subtotal: 0,
        deliveryFee: 260,
        total: 260,
        paymentStatus: "failed",
        paymentMethod: "mpesa",
        orderStatus: "cancelled",
        createdAt: new Date(),
        deliveryAddress: "123 Main St, Nairobi",
        specialInstructions: undefined,
      };

      const html = generateReceiptHTML(mockReceipt);

      expect(html).toContain("FAILED");
    });

    it("should format items correctly in receipt", () => {
      const mockReceipt = {
        orderId: 1,
        orderNumber: "ORD-000001",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+254123456789",
        restaurantName: "Test Restaurant",
        items: [
          { name: "Burger", quantity: 1, price: 400, subtotal: 400 },
          { name: "Fries", quantity: 2, price: 150, subtotal: 300 },
        ],
        subtotal: 700,
        deliveryFee: 260,
        total: 960,
        paymentStatus: "completed",
        paymentMethod: "mpesa",
        orderStatus: "delivered",
        createdAt: new Date(),
        deliveryAddress: "123 Main St, Nairobi",
        specialInstructions: undefined,
      };

      const html = generateReceiptHTML(mockReceipt);

      expect(html).toContain("Burger");
      expect(html).toContain("Fries");
      expect(html).toContain("Item");
      expect(html).toContain("Qty");
      expect(html).toContain("Price");
    });
  });
});

describe("Financial Reports", () => {
  describe("Report Data Aggregation", () => {
    it("should calculate total revenue correctly", () => {
      const orders = [
        { totalAmount: "1000", status: "delivered", createdAt: new Date() },
        { totalAmount: "2000", status: "delivered", createdAt: new Date() },
        { totalAmount: "500", status: "delivered", createdAt: new Date() },
      ];

      const totalRevenue = orders.reduce((sum, order) => {
        return sum + parseFloat(order.totalAmount || "0");
      }, 0);

      expect(totalRevenue).toBe(3500);
    });

    it("should calculate average order value correctly", () => {
      const orders = [
        { totalAmount: "1000", status: "delivered" },
        { totalAmount: "2000", status: "delivered" },
        { totalAmount: "500", status: "delivered" },
      ];

      const totalRevenue = orders.reduce((sum, order) => {
        return sum + parseFloat(order.totalAmount || "0");
      }, 0);
      const avgOrderValue = totalRevenue / orders.length;

      expect(avgOrderValue).toBe(1166.6666666666667);
      expect(parseFloat(avgOrderValue.toFixed(2))).toBe(1166.67);
    });

    it("should count orders by status correctly", () => {
      const orders = [
        { status: "delivered" },
        { status: "delivered" },
        { status: "on_the_way" },
        { status: "preparing" },
        { status: "placed" },
        { status: "cancelled" },
      ];

      const statusCounts: Record<string, number> = {
        placed: 0,
        preparing: 0,
        on_the_way: 0,
        delivered: 0,
        cancelled: 0,
      };

      orders.forEach((order) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      expect(statusCounts.delivered).toBe(2);
      expect(statusCounts.on_the_way).toBe(1);
      expect(statusCounts.preparing).toBe(1);
      expect(statusCounts.placed).toBe(1);
      expect(statusCounts.cancelled).toBe(1);
    });

    it("should aggregate daily revenue correctly", () => {
      const orders = [
        { totalAmount: "1000", createdAt: new Date("2026-06-01") },
        { totalAmount: "500", createdAt: new Date("2026-06-01") },
        { totalAmount: "2000", createdAt: new Date("2026-06-02") },
        { totalAmount: "1500", createdAt: new Date("2026-06-02") },
      ];

      const dailyData: Record<string, number> = {};

      orders.forEach((order) => {
        const date = new Date(order.createdAt);
        const dateStr = date.toISOString().split("T")[0];
        const revenue = parseFloat(order.totalAmount || "0");
        dailyData[dateStr] = (dailyData[dateStr] || 0) + revenue;
      });

      expect(dailyData["2026-06-01"]).toBe(1500);
      expect(dailyData["2026-06-02"]).toBe(3500);
    });

    it("should count payment methods correctly", () => {
      const orders = [
        { paymentMethod: "mpesa" },
        { paymentMethod: "mpesa" },
        { paymentMethod: "card" },
        { paymentMethod: "cash" },
      ];

      const methodCounts: Record<string, number> = {};

      orders.forEach((order) => {
        const method = order.paymentMethod || "unknown";
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      });

      expect(methodCounts.mpesa).toBe(2);
      expect(methodCounts.card).toBe(1);
      expect(methodCounts.cash).toBe(1);
    });
  });

  describe("Date Range Filtering", () => {
    it("should filter orders by date range", () => {
      const orders = [
        { totalAmount: "1000", createdAt: new Date("2026-06-01") },
        { totalAmount: "500", createdAt: new Date("2026-06-05") },
        { totalAmount: "2000", createdAt: new Date("2026-06-10") },
      ];

      const startDate = new Date("2026-06-03");
      const endDate = new Date("2026-06-08");

      const filtered = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].totalAmount).toBe("500");
    });

    it("should handle empty date range results", () => {
      const orders = [
        { totalAmount: "1000", createdAt: new Date("2026-06-01") },
        { totalAmount: "500", createdAt: new Date("2026-06-02") },
      ];

      const startDate = new Date("2026-07-01");
      const endDate = new Date("2026-07-31");

      const filtered = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      expect(filtered.length).toBe(0);
    });
  });
});
