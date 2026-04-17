import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendSMS, sendOrderStatusNotification } from "./sms";
import axios from "axios";

vi.mock("axios");
const mockedAxios = axios as any;

describe("SMS Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendSMS", () => {
    it("should successfully send SMS with valid phone number", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          SMSMessageData: {
            Recipients: [
              {
                statusCode: "101",
                messageId: "ATXid_1234567890",
                status: "Success",
              },
            ],
          },
        },
      });

      const result = await sendSMS({
        phoneNumber: "0712345678",
        message: "Test message",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("ATXid_1234567890");
      expect(result.statusCode).toBe("101");
    });

    it("should format phone number with country code", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          SMSMessageData: {
            Recipients: [
              {
                statusCode: "101",
                messageId: "ATXid_1234567890",
                status: "Success",
              },
            ],
          },
        },
      });

      await sendSMS({
        phoneNumber: "0712345678",
        message: "Test",
      });

      const postCall = mockedAxios.post.mock.calls[0];
      expect(postCall[1].to).toBe("+254712345678");
    });

    it("should handle SMS send failure", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          SMSMessageData: {
            Recipients: [
              {
                statusCode: "100",
                messageId: null,
                status: "Invalid phone number",
              },
            ],
          },
        },
      });

      const result = await sendSMS({
        phoneNumber: "0712345678",
        message: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe("100");
    });

    it("should handle network errors", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      const result = await sendSMS({
        phoneNumber: "0712345678",
        message: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain("Network error");
    });
  });

  describe("sendOrderStatusNotification", () => {
    it("should send on_the_way notification with correct message", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          SMSMessageData: {
            Recipients: [
              {
                statusCode: "101",
                messageId: "ATXid_1234567890",
                status: "Success",
              },
            ],
          },
        },
      });

      const result = await sendOrderStatusNotification({
        phoneNumber: "0712345678",
        orderId: 123,
        status: "on_the_way",
        restaurantName: "Pizza Palace",
        estimatedTime: "15 mins",
      });

      expect(result.success).toBe(true);

      const postCall = mockedAxios.post.mock.calls[0];
      expect(postCall[1].message).toContain("#123");
      expect(postCall[1].message).toContain("Pizza Palace");
      expect(postCall[1].message).toContain("on the way");
      expect(postCall[1].message).toContain("15 mins");
    });

    it("should send delivered notification with correct message", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          SMSMessageData: {
            Recipients: [
              {
                statusCode: "101",
                messageId: "ATXid_1234567890",
                status: "Success",
              },
            ],
          },
        },
      });

      const result = await sendOrderStatusNotification({
        phoneNumber: "0712345678",
        orderId: 456,
        status: "delivered",
        restaurantName: "Burger Barn",
      });

      expect(result.success).toBe(true);

      const postCall = mockedAxios.post.mock.calls[0];
      expect(postCall[1].message).toContain("#456");
      expect(postCall[1].message).toContain("Burger Barn");
      expect(postCall[1].message).toContain("delivered");
      expect(postCall[1].message).toContain("Enjoy your meal");
    });

    it("should handle invalid status", async () => {
      const result = await sendOrderStatusNotification({
        phoneNumber: "0712345678",
        orderId: 789,
        status: "invalid_status" as any,
        restaurantName: "Test Restaurant",
      });

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain("Invalid status");
    });

    it("should send notification without estimated time", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          SMSMessageData: {
            Recipients: [
              {
                statusCode: "101",
                messageId: "ATXid_1234567890",
                status: "Success",
              },
            ],
          },
        },
      });

      const result = await sendOrderStatusNotification({
        phoneNumber: "0712345678",
        orderId: 999,
        status: "on_the_way",
        restaurantName: "Sushi Spot",
      });

      expect(result.success).toBe(true);

      const postCall = mockedAxios.post.mock.calls[0];
      expect(postCall[1].message).toContain("on the way");
    });
  });
});
