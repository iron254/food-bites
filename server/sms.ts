import axios from "axios";
import { ENV } from "./_core/env";
import { logSMS, getUserNotificationPreferences } from "./db";

const AFRICAS_TALKING_API_URL = "https://api.sandbox.africastalking.com/version1";

/**
 * Send SMS notification via Africa's Talking
 */
export async function sendSMS(params: {
  phoneNumber: string;
  message: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  statusCode?: string;
  errorMessage?: string;
}> {
  try {
    // Format phone number: ensure it starts with country code
    let formattedPhone = params.phoneNumber;
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+254" + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith("254")) {
        formattedPhone = "+254" + formattedPhone;
      } else {
        formattedPhone = "+" + formattedPhone;
      }
    }

    const response = await axios.post(
      `${AFRICAS_TALKING_API_URL}/messaging`,
      {
        username: ENV.africasTalkingUsername,
        to: formattedPhone,
        message: params.message,
      },
      {
        auth: {
          username: ENV.africasTalkingUsername,
          password: ENV.africasTalkingApiKey,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      }
    );

    const data = response.data;

    if (data.SMSMessageData?.Recipients?.length > 0) {
      const recipient = data.SMSMessageData.Recipients[0];
      return {
        success: recipient.statusCode === "101",
        messageId: recipient.messageId,
        statusCode: recipient.statusCode,
        errorMessage: recipient.statusCode !== "101" ? recipient.status : undefined,
      };
    }

    return {
      success: false,
      errorMessage: "No recipients in response",
    };
  } catch (error: any) {
    console.error("SMS send failed:", error.message);
    return {
      success: false,
      errorMessage: error.message || "Failed to send SMS",
    };
  }
}

/**
 * Send order status notification SMS (with preference check and logging)
 */
export async function sendOrderStatusNotification(params: {
  phoneNumber: string;
  orderId: number;
  status: "on_the_way" | "delivered";
  restaurantName: string;
  estimatedTime?: string;
  userId?: number;
}): Promise<{ success: boolean; errorMessage?: string }> {
  let message = "";

  if (params.status === "on_the_way") {
    message = `Your order #${params.orderId} from ${params.restaurantName} is on the way! ${
      params.estimatedTime ? `Arriving in ~${params.estimatedTime}` : ""
    }`;
  } else if (params.status === "delivered") {
    message = `Your order #${params.orderId} from ${params.restaurantName} has been delivered. Enjoy your meal!`;
  }

  if (!message) {
    return { success: false, errorMessage: "Invalid status" };
  }

  // Check user notification preferences if userId is provided
  if (params.userId) {
    const prefs = await getUserNotificationPreferences(params.userId);
    if (prefs) {
      const shouldSend =
        (params.status === "on_the_way" && prefs.smsOnOrderOnTheWay) ||
        (params.status === "delivered" && prefs.smsOnOrderDelivered);
      if (!shouldSend) {
        return { success: true, errorMessage: "SMS disabled by user preference" };
      }
    }
  }

  const result = await sendSMS({
    phoneNumber: params.phoneNumber,
    message,
  });

  // Log the SMS attempt
  await logSMS({
    orderId: params.orderId,
    phoneNumber: params.phoneNumber,
    message,
    status: result.success ? "sent" : "failed",
    messageId: result.messageId,
    errorMessage: result.errorMessage,
  });

  return result;
}
