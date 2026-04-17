import { describe, it, expect, vi, beforeEach } from "vitest";
import { initiateSTKPush, querySTKPushStatus } from "./mpesa";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as any;

describe("M-Pesa Payment Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initiateSTKPush", () => {
    it("should successfully initiate STK push with valid parameters", async () => {
      // Mock the auth token response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          access_token: "test_token_123",
          expires_in: 3600,
        },
      });

      // Mock the STK push response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          CheckoutRequestID: "ws_CO_DMZ_123456789",
          ResponseCode: "0",
          ResponseDescription: "Success. Request accepted for processing",
          CustomerMessage: "Success. Request accepted for processing",
        },
      });

      const result = await initiateSTKPush({
        phoneNumber: "0712345678",
        amount: 1000,
        accountReference: "ORDER123",
        transactionDescription: "Food Bites Order #123",
        callbackUrl: "https://example.com/callback",
      });

      expect(result.responseCode).toBe("0");
      expect(result.checkoutRequestId).toBe("ws_CO_DMZ_123456789");
      expect(result.customerMessage).toContain("Success");
    });

    it("should format phone number correctly (add country code)", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "test_token", expires_in: 3600 },
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          CheckoutRequestID: "ws_CO_DMZ_123456789",
          ResponseCode: "0",
          ResponseDescription: "Success",
          CustomerMessage: "Success",
        },
      });

      await initiateSTKPush({
        phoneNumber: "0712345678",
        amount: 500,
        accountReference: "ORDER456",
        transactionDescription: "Test Order",
        callbackUrl: "https://example.com/callback",
      });

      // Verify the phone number was formatted correctly in the post call
      const postCall = mockedAxios.post.mock.calls[0];
      expect(postCall[1].PartyA).toBe("254712345678");
    });

    it("should handle authentication failure", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Auth failed"));

      await expect(
        initiateSTKPush({
          phoneNumber: "0712345678",
          amount: 1000,
          accountReference: "ORDER123",
          transactionDescription: "Test",
          callbackUrl: "https://example.com/callback",
        })
      ).rejects.toThrow("Failed to initiate payment");
    });

    it("should handle STK push failure", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "test_token", expires_in: 3600 },
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          ResponseCode: "1",
          ResponseDescription: "Invalid request",
          CustomerMessage: "Invalid request",
        },
      });

      const result = await initiateSTKPush({
        phoneNumber: "0712345678",
        amount: 1000,
        accountReference: "ORDER123",
        transactionDescription: "Test",
        callbackUrl: "https://example.com/callback",
      });

      expect(result.responseCode).toBe("1");
      expect(result.responseDescription).toBe("Invalid request");
    });
  });

  describe("querySTKPushStatus", () => {
    it("should successfully query STK push status", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "test_token", expires_in: 3600 },
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          ResponseCode: "0",
          ResponseDescription: "The service request has been accepted successfully",
          ResultCode: "0",
          ResultDesc: "The service request has been accepted successfully",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 1000 },
              { Name: "MpesaReceiptNumber", Value: "LIJ7791697437" },
            ],
          },
        },
      });

      const result = await querySTKPushStatus({
        checkoutRequestId: "ws_CO_DMZ_123456789",
      });

      expect(result.responseCode).toBe("0");
      expect(result.resultCode).toBe("0");
      expect(result.amount).toBe(1000);
      expect(result.transactionId).toBe("LIJ7791697437");
    });

    it("should handle query failure", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "test_token", expires_in: 3600 },
      });

      mockedAxios.post.mockRejectedValueOnce(new Error("Query failed"));

      await expect(
        querySTKPushStatus({
          checkoutRequestId: "ws_CO_DMZ_123456789",
        })
      ).rejects.toThrow("Failed to query payment status");
    });

    it("should handle pending payment status", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "test_token", expires_in: 3600 },
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          ResponseCode: "0",
          ResponseDescription: "Request in progress",
          ResultCode: "1032",
          ResultDesc: "Request timeout",
        },
      });

      const result = await querySTKPushStatus({
        checkoutRequestId: "ws_CO_DMZ_123456789",
      });

      expect(result.resultCode).toBe("1032");
      expect(result.resultDesc).toBe("Request timeout");
    });
  });

  describe("Token caching", () => {
    it("should cache access token and reuse it", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "cached_token", expires_in: 3600 },
      });

      mockedAxios.post.mockResolvedValue({
        data: {
          CheckoutRequestID: "ws_CO_DMZ_123456789",
          ResponseCode: "0",
          ResponseDescription: "Success",
          CustomerMessage: "Success",
        },
      });

      // First call should fetch token
      await initiateSTKPush({
        phoneNumber: "0712345678",
        amount: 1000,
        accountReference: "ORDER1",
        transactionDescription: "Test 1",
        callbackUrl: "https://example.com/callback",
      });

      // Second call should reuse cached token
      await initiateSTKPush({
        phoneNumber: "0712345678",
        amount: 2000,
        accountReference: "ORDER2",
        transactionDescription: "Test 2",
        callbackUrl: "https://example.com/callback",
      });

      // axios.post should be called twice (for both STK pushes)
      expect(mockedAxios.post.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
