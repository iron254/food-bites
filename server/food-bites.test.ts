import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Helpers ───────────────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<NonNullable<TrpcContext["user"]>>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-openid",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ role: "admin", openId: "admin-openid" });
}

// ── Auth Tests ────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });
});

// ── Restaurant Tests ──────────────────────────────────────────────────────────

describe("restaurants.list", () => {
  it("is accessible without authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // Should not throw — public procedure
    const result = await caller.restaurants.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts search and cuisine filters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.restaurants.list({ search: "pizza", cuisine: "Pizza" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("restaurants.create (admin only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.restaurants.create({
        name: "Test Restaurant",
        cuisine: "Test",
      })
    ).rejects.toThrow();
  });
});

// ── Menu Tests ────────────────────────────────────────────────────────────────

describe("menu.getItems", () => {
  it("is accessible without authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.menu.getItems({ restaurantId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("menu.getAllItems (admin only)", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.menu.getAllItems({ restaurantId: 1 })).rejects.toThrow();
  });

  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.menu.getAllItems({ restaurantId: 1 })).rejects.toThrow();
  });
});

// ── Orders Tests ──────────────────────────────────────────────────────────────

describe("orders.myOrders", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.orders.myOrders()).rejects.toThrow();
  });

  it("returns array for authenticated users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.orders.myOrders();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("orders.adminList", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.orders.adminList({})).rejects.toThrow();
  });
});

describe("orders.updateStatus", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.orders.updateStatus({ id: 1, status: "preparing" })
    ).rejects.toThrow();
  });
});

describe("orders.create", () => {
  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.orders.create({
        restaurantId: 1,
        items: [{ menuItemId: 1, name: "Margherita", price: "14.99", quantity: 1 }],
        deliveryAddress: "123 Test Street",
        totalAmount: "17.98",
      })
    ).rejects.toThrow();
  });

  it("creates an order and returns an orderId for authenticated users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.orders.create({
      restaurantId: 1,
      items: [{ menuItemId: 1, name: "Margherita", price: "14.99", quantity: 2 }],
      deliveryAddress: "456 Test Avenue, City",
      deliveryName: "Test User",
      deliveryPhone: "+1 555 000 0000",
      notes: "No onions please",
      totalAmount: "32.97",
      deliveryFee: "2.99",
    });
    expect(result).toHaveProperty("orderId");
    expect(typeof result.orderId).toBe("number");
    expect(result.orderId).toBeGreaterThan(0);
  });
});

// ── Auth Logout Tests ─────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: createUserContext().user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});
