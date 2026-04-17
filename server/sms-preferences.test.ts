import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendOrderStatusNotification } from "./sms";
import { getUserNotificationPreferences } from "./db";
import axios from "axios";

vi.mock("axios");
vi.mock("./db");

const mockedAxios = axios as any;
const mockedDb = {
  getUserNotificationPreferences: getUserNotificationPreferences as any,
};

describe("SMS Preferences - Gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send SMS when user preference is enabled for on_the_way", async () => {
    mockedDb.getUserNotificationPreferences.mockResolvedValueOnce({
      id: 1,
      userId: 123,
      smsOnOrderOnTheWay: true,
      smsOnOrderDelivered: true,
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        SMSMessageData: {
          Recipients: [
            {
              statusCode: "101",
              messageId: "ATXid_123",
              status: "Success",
            },
          ],
        },
      },
    });

    const result = await sendOrderStatusNotification({
      phoneNumber: "0712345678",
      orderId: 1,
      status: "on_the_way",
      restaurantName: "Pizza Palace",
      userId: 123,
    });

    expect(result.success).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it("should NOT send SMS when user preference is disabled for on_the_way", async () => {
    mockedDb.getUserNotificationPreferences.mockResolvedValueOnce({
      id: 1,
      userId: 123,
      smsOnOrderOnTheWay: false,
      smsOnOrderDelivered: true,
    });

    const result = await sendOrderStatusNotification({
      phoneNumber: "0712345678",
      orderId: 1,
      status: "on_the_way",
      restaurantName: "Pizza Palace",
      userId: 123,
    });

    expect(result.success).toBe(true);
    expect(result.errorMessage).toContain("disabled by user preference");
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("should NOT send SMS when user preference is disabled for delivered", async () => {
    mockedDb.getUserNotificationPreferences.mockResolvedValueOnce({
      id: 1,
      userId: 123,
      smsOnOrderOnTheWay: true,
      smsOnOrderDelivered: false,
    });

    const result = await sendOrderStatusNotification({
      phoneNumber: "0712345678",
      orderId: 1,
      status: "delivered",
      restaurantName: "Pizza Palace",
      userId: 123,
    });

    expect(result.success).toBe(true);
    expect(result.errorMessage).toContain("disabled by user preference");
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("should send SMS when no user preferences exist (defaults to enabled)", async () => {
    mockedDb.getUserNotificationPreferences.mockResolvedValueOnce(null);

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        SMSMessageData: {
          Recipients: [
            {
              statusCode: "101",
              messageId: "ATXid_123",
              status: "Success",
            },
          ],
        },
      },
    });

    const result = await sendOrderStatusNotification({
      phoneNumber: "0712345678",
      orderId: 1,
      status: "on_the_way",
      restaurantName: "Pizza Palace",
      userId: 123,
    });

    expect(result.success).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it("should send SMS when userId is not provided (no preference check)", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        SMSMessageData: {
          Recipients: [
            {
              statusCode: "101",
              messageId: "ATXid_123",
              status: "Success",
            },
          ],
        },
      },
    });

    const result = await sendOrderStatusNotification({
      phoneNumber: "0712345678",
      orderId: 1,
      status: "on_the_way",
      restaurantName: "Pizza Palace",
    });

    expect(result.success).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalled();
    expect(mockedDb.getUserNotificationPreferences).not.toHaveBeenCalled();
  });
});
