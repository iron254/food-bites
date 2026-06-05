import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { handleMpesaCallback } from "./mpesa-callback";
import * as db from "./db";

// Mock the db module
vi.mock("./db", () => ({
  getOrderByCheckoutRequestId: vi.fn(),
  updateOrderPaymentStatus: vi.fn(),
}));

describe("M-Pesa Callback Handler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn().mockReturnValue({});
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockReq = {
      body: {},
    };
  });

  it("should return 400 for invalid payload structure", async () => {
    mockReq.body = { invalid: "payload" };

    await handleMpesaCallback(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid payload" });
  });

  it("should return 404 when order not found", async () => {
    mockReq.body = {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-id",
          CheckoutRequestID: "test-checkout-id",
          ResultCode: 0,
          ResultDesc: "The service request has been processed successfully.",
        },
      },
    };

    vi.mocked(db.getOrderByCheckoutRequestId).mockResolvedValueOnce(undefined);

    await handleMpesaCallback(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Order not found" });
  });

  it("should update order status to completed on successful payment", async () => {
    const mockOrder = {
      id: 123,
      userId: 1,
      restaurantId: 1,
      status: "placed",
      paymentStatus: "processing",
      mpesaCheckoutRequestId: "test-checkout-id",
      totalAmount: "1000",
      deliveryFee: "100",
      deliveryAddress: "123 Main St",
      deliveryName: "John Doe",
      deliveryPhone: "+254712345678",
      notes: "",
      estimatedDelivery: "30-45 min",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReq.body = {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-id",
          CheckoutRequestID: "test-checkout-id",
          ResultCode: 0,
          ResultDesc: "The service request has been processed successfully.",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: "1000" },
              { Name: "MpesaReceiptNumber", Value: "LHG31H5V6061" },
              { Name: "Balance", Value: "0" },
              { Name: "TransactionDate", Value: "20240101120000" },
              { Name: "PhoneNumber", Value: "254712345678" },
            ],
          },
        },
      },
    };

    vi.mocked(db.getOrderByCheckoutRequestId).mockResolvedValueOnce(mockOrder as any);

    await handleMpesaCallback(mockReq as Request, mockRes as Response);

    expect(db.updateOrderPaymentStatus).toHaveBeenCalledWith(
      123,
      "completed",
      "LHG31H5V6061",
      "test-checkout-id"
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Callback processed",
      orderId: 123,
      paymentStatus: "completed",
    });
  });

  it("should update order status to failed on payment failure", async () => {
    const mockOrder = {
      id: 124,
      userId: 1,
      restaurantId: 1,
      status: "placed",
      paymentStatus: "processing",
      mpesaCheckoutRequestId: "test-checkout-id-2",
      totalAmount: "1000",
      deliveryFee: "100",
      deliveryAddress: "123 Main St",
      deliveryName: "John Doe",
      deliveryPhone: "+254712345678",
      notes: "",
      estimatedDelivery: "30-45 min",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReq.body = {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-id",
          CheckoutRequestID: "test-checkout-id-2",
          ResultCode: 1,
          ResultDesc: "Cancelled by user",
        },
      },
    };

    vi.mocked(db.getOrderByCheckoutRequestId).mockResolvedValueOnce(mockOrder as any);

    await handleMpesaCallback(mockReq as Request, mockRes as Response);

    expect(db.updateOrderPaymentStatus).toHaveBeenCalledWith(
      124,
      "failed",
      undefined,
      "test-checkout-id-2"
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Callback processed",
      orderId: 124,
      paymentStatus: "failed",
    });
  });

  it("should handle missing callback metadata gracefully", async () => {
    const mockOrder = {
      id: 125,
      userId: 1,
      restaurantId: 1,
      status: "placed",
      paymentStatus: "processing",
      mpesaCheckoutRequestId: "test-checkout-id-3",
      totalAmount: "1000",
      deliveryFee: "100",
      deliveryAddress: "123 Main St",
      deliveryName: "John Doe",
      deliveryPhone: "+254712345678",
      notes: "",
      estimatedDelivery: "30-45 min",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReq.body = {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-id",
          CheckoutRequestID: "test-checkout-id-3",
          ResultCode: 0,
          ResultDesc: "The service request has been processed successfully.",
          // No CallbackMetadata
        },
      },
    };

    vi.mocked(db.getOrderByCheckoutRequestId).mockResolvedValueOnce(mockOrder as any);

    await handleMpesaCallback(mockReq as Request, mockRes as Response);

    expect(db.updateOrderPaymentStatus).toHaveBeenCalledWith(
      125,
      "completed",
      undefined,
      "test-checkout-id-3"
    );
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it("should handle database errors gracefully", async () => {
    mockReq.body = {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-id",
          CheckoutRequestID: "test-checkout-id",
          ResultCode: 0,
          ResultDesc: "The service request has been processed successfully.",
        },
      },
    };

    vi.mocked(db.getOrderByCheckoutRequestId).mockRejectedValueOnce(
      new Error("Database error")
    );

    await handleMpesaCallback(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
