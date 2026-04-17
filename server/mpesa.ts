import axios from "axios";
import { ENV } from "./_core/env";

const MPESA_AUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const MPESA_STK_PUSH_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
const MPESA_QUERY_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get M-Pesa access token
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  try {
    const auth = Buffer.from(
      `${ENV.mpesaConsumerKey}:${ENV.mpesaConsumerSecret}`
    ).toString("base64");

    const response = await axios.get(MPESA_AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600; // Default 1 hour

    cachedAccessToken = {
      token,
      expiresAt: Date.now() + expiresIn * 1000 - 60000, // Refresh 1 min before expiry
    };

    return token;
  } catch (error) {
    console.error("Failed to get M-Pesa access token:", error);
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

/**
 * Initiate STK push for payment
 */
export async function initiateSTKPush(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDescription: string;
  callbackUrl: string;
}): Promise<{
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}> {
  try {
    const token = await getAccessToken();

    // Format phone number: remove leading 0 and add country code
    const formattedPhone = params.phoneNumber.replace(/^0/, "254");

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(
      `${ENV.mpesaShortcode}${ENV.mpesaPasskey}${timestamp}`
    ).toString("base64");

    const response = await axios.post(
      MPESA_STK_PUSH_URL,
      {
        BusinessShortCode: ENV.mpesaShortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(params.amount), // M-Pesa expects whole numbers
        PartyA: formattedPhone,
        PartyB: ENV.mpesaShortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: params.callbackUrl,
        AccountReference: params.accountReference,
        TransactionDesc: params.transactionDescription,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage,
    };
  } catch (error) {
    console.error("STK push failed:", error);
    throw new Error("Failed to initiate payment");
  }
}

/**
 * Query STK push status
 */
export async function querySTKPushStatus(params: {
  checkoutRequestId: string;
}): Promise<{
  responseCode: string;
  responseDescription: string;
  resultCode?: string;
  resultDesc?: string;
  amount?: number;
  transactionId?: string;
}> {
  try {
    const token = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(
      `${ENV.mpesaShortcode}${ENV.mpesaPasskey}${timestamp}`
    ).toString("base64");

    const response = await axios.post(
      MPESA_QUERY_URL,
      {
        BusinessShortCode: ENV.mpesaShortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: params.checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      amount: response.data.CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "Amount"
      )?.Value,
      transactionId: response.data.CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      )?.Value,
    };
  } catch (error) {
    console.error("STK query failed:", error);
    throw new Error("Failed to query payment status");
  }
}

/**
 * Validate M-Pesa callback signature
 */
export function validateCallback(
  signature: string,
  body: string
): boolean {
  // In production, validate the signature using M-Pesa's public key
  // For now, we'll do a basic validation
  return signature && body ? true : false;
}
