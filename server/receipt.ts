import { getDb } from "./db";
import { orders, orderItems, restaurants, menuItems, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { formatKES } from "@shared/currency";

export interface ReceiptData {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  restaurantName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  orderStatus: string;
  createdAt: Date;
  deliveryAddress?: string;
  specialInstructions?: string;
}

/**
 * Fetch receipt data for an order
 */
export async function getReceiptData(orderId: number, userId: number): Promise<ReceiptData | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Fetch order with restaurant info
    const order = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        restaurantId: orders.restaurantId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        totalAmount: orders.totalAmount,
        deliveryFee: orders.deliveryFee,
        deliveryAddress: orders.deliveryAddress,
        deliveryName: orders.deliveryName,
        deliveryPhone: orders.deliveryPhone,
        notes: orders.notes,
        createdAt: orders.createdAt,
        restaurantName: restaurants.name,
      })
      .from(orders)
      .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order || order.length === 0) return null;

    const orderData = order[0];

    // Verify user owns this order
    if (orderData.userId !== userId) return null;

    // Fetch user info for receipt
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userData = userResult?.[0];

    // Fetch order items with menu item details
    const items = await db
      .select({
        name: menuItems.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, orderId));

    const receiptItems = items.map((item) => ({
      name: item.name || "Unknown Item",
      quantity: item.quantity,
      price: parseFloat(item.price || "0"),
      subtotal: parseFloat(item.price || "0") * item.quantity,
    }));

    return {
      orderId,
      orderNumber: `ORD-${String(orderId).padStart(6, "0")}`,
      customerName: orderData.deliveryName || userData?.name || "Customer",
      customerEmail: userData?.email || undefined,
      customerPhone: orderData.deliveryPhone || undefined,
      restaurantName: orderData.restaurantName || "Restaurant",
      items: receiptItems,
      subtotal: receiptItems.reduce((sum, item) => sum + item.subtotal, 0),
      deliveryFee: parseFloat(orderData.deliveryFee || "0"),
      total: parseFloat(orderData.totalAmount || "0"),
      paymentStatus: orderData.paymentStatus || "pending",
      paymentMethod: orderData.paymentMethod || "unknown",
      orderStatus: orderData.status || "pending",
      createdAt: new Date(orderData.createdAt),
      deliveryAddress: orderData.deliveryAddress || undefined,
      specialInstructions: orderData.notes || undefined,
    };
  } catch (error) {
    console.error("[Receipt] Failed to fetch receipt data:", error);
    return null;
  }
}

/**
 * Generate receipt HTML for PDF conversion
 */
export function generateReceiptHTML(receipt: ReceiptData): string {
  const formattedDate = receipt.createdAt.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHTML = receipt.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatKES(item.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatKES(item.subtotal)}</td>
    </tr>
  `
    )
    .join("");

  const statusColor =
    receipt.paymentStatus === "completed" ? "#22c55e" : receipt.paymentStatus === "failed" ? "#ef4444" : "#f59e0b";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #ff6b35;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #ff6b35;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .order-info {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .order-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .order-info-label {
          font-weight: bold;
          color: #666;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background: #f3f4f6;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #e5e7eb;
        }
        .items-table th:nth-child(2),
        .items-table th:nth-child(3),
        .items-table th:nth-child(4) {
          text-align: right;
        }
        .summary {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .summary-row.total {
          font-size: 18px;
          font-weight: bold;
          color: #ff6b35;
          border-top: 2px solid #e5e7eb;
          padding-top: 10px;
          margin-top: 10px;
        }
        .payment-status {
          background: ${statusColor};
          color: white;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .footer {
          text-align: center;
          color: #999;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
          margin-top: 20px;
        }
        .delivery-info {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #0ea5e9;
        }
        .delivery-info-label {
          font-weight: bold;
          color: #0369a1;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍽️ FoodBites</h1>
          <p>Order Receipt</p>
        </div>

        <div class="order-info">
          <div class="order-info-row">
            <span class="order-info-label">Order Number:</span>
            <span>${receipt.orderNumber}</span>
          </div>
          <div class="order-info-row">
            <span class="order-info-label">Date & Time:</span>
            <span>${formattedDate}</span>
          </div>
          <div class="order-info-row">
            <span class="order-info-label">Restaurant:</span>
            <span>${receipt.restaurantName}</span>
          </div>
          <div class="order-info-row">
            <span class="order-info-label">Customer:</span>
            <span>${receipt.customerName}</span>
          </div>
          <div class="order-info-row">
            <span class="order-info-label">Order Status:</span>
            <span style="text-transform: capitalize;">${receipt.orderStatus.replace(/_/g, " ")}</span>
          </div>
        </div>

        <div class="payment-status">
          Payment: ${receipt.paymentStatus.toUpperCase()}
        </div>

        ${
          receipt.deliveryAddress
            ? `
          <div class="delivery-info">
            <div class="delivery-info-label">📍 Delivery Address</div>
            <p style="margin: 5px 0;">${receipt.deliveryAddress}</p>
          </div>
        `
            : ""
        }

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${formatKES(receipt.subtotal)}</span>
          </div>
          <div class="summary-row">
            <span>Delivery Fee</span>
            <span>${formatKES(receipt.deliveryFee)}</span>
          </div>
          <div class="summary-row total">
            <span>Total Amount</span>
            <span>${formatKES(receipt.total)}</span>
          </div>
        </div>

        ${
          receipt.specialInstructions
            ? `
          <div style="background: #fef3c7; padding: 10px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <strong style="color: #92400e;">Special Instructions:</strong>
            <p style="margin: 5px 0; color: #78350f;">${receipt.specialInstructions}</p>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Thank you for your order! 🙏</p>
          <p>For support, contact us at oluochraymond6@gmail.com or +254769535484</p>
          <p>Receipt generated on ${new Date().toLocaleString("en-KE")}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
