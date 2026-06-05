import { Request, Response } from "express";
import { getOrderByCheckoutRequestId, updateOrderPaymentStatus } from "./db";
import { validateCallback } from "./mpesa";

/**
 * M-Pesa callback payload structure
 */
interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

/**
 * Handle M-Pesa callback from Safaricom
 * Updates order payment status based on callback result
 */
export async function handleMpesaCallback(req: Request, res: Response) {
  try {
    const payload: MpesaCallbackPayload = req.body;

    if (!payload?.Body?.stkCallback) {
      console.error("[M-Pesa Callback] Invalid payload structure");
      return res.status(400).json({ error: "Invalid payload" });
    }

    const callback = payload.Body.stkCallback;
    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    // Find order by CheckoutRequestID
    const order = await getOrderByCheckoutRequestId(checkoutRequestId);
    if (!order) {
      console.warn(`[M-Pesa Callback] Order not found for CheckoutRequestID: ${checkoutRequestId}`);
      return res.status(404).json({ error: "Order not found" });
    }

    // Extract transaction details from callback metadata
    let mpesaTransactionId: string | undefined;
    let amount: number | undefined;

    if (callback.CallbackMetadata?.Item) {
      const amountItem = callback.CallbackMetadata.Item.find((item) => item.Name === "Amount");
      const receiptItem = callback.CallbackMetadata.Item.find(
        (item) => item.Name === "MpesaReceiptNumber"
      );

      if (amountItem) amount = Number(amountItem.Value);
      if (receiptItem) mpesaTransactionId = String(receiptItem.Value);
    }

    // Determine payment status based on result code
    // Result code 0 = success, non-zero = failure
    let paymentStatus: "completed" | "failed";
    if (resultCode === 0) {
      paymentStatus = "completed";
      console.log(
        `[M-Pesa Callback] Payment successful for order ${order.id}: ${mpesaTransactionId}`
      );
    } else {
      paymentStatus = "failed";
      console.warn(
        `[M-Pesa Callback] Payment failed for order ${order.id}: ${resultDesc} (Code: ${resultCode})`
      );
    }

    // Update order payment status
    await updateOrderPaymentStatus(
      order.id,
      paymentStatus,
      mpesaTransactionId,
      checkoutRequestId
    );

    // Return success to M-Pesa (they expect 200 OK)
    res.status(200).json({
      success: true,
      message: "Callback processed",
      orderId: order.id,
      paymentStatus,
    });
  } catch (error) {
    console.error("[M-Pesa Callback] Error processing callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
