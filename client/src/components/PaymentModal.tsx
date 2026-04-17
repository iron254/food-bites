import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { formatKES } from "@shared/currency";
import { AlertCircle, CheckCircle2, Loader, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PaymentModalProps {
  orderId: number;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  orderId,
  amount,
  isOpen,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentStep, setPaymentStep] = useState<"input" | "processing" | "success" | "error">("input");
  const [errorMessage, setErrorMessage] = useState("");

  const initiatePayment = trpc.orders.initiatePayment.useMutation();
  const queryPaymentStatus = trpc.orders.queryPaymentStatus.useQuery(
    { orderId },
    { enabled: paymentStep === "processing", refetchInterval: 2000 }
  );

  useEffect(() => {
    if (paymentStep === "processing" && queryPaymentStatus.data) {
      const status = queryPaymentStatus.data as any;
      if (status.resultCode === "0") {
        setPaymentStep("success");
        toast.success("Payment successful!", { description: "Your order is confirmed." });
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 2000);
      } else if (status.resultCode && status.resultCode !== "0") {
        setPaymentStep("error");
        setErrorMessage(status.resultDesc || "Payment failed. Please try again.");
      }
    }
  }, [queryPaymentStatus.data, paymentStep, onPaymentSuccess, onClose]);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^(\+?254|0)[1-9]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      toast.error("Please enter a valid Kenyan phone number");
      return;
    }

    setPaymentStep("processing");
    setErrorMessage("");

    try {
      const result = await initiatePayment.mutateAsync({
        orderId,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        amount: Math.round(amount),
      });

      if (result.responseCode === "0") {
        toast.info("STK prompt sent to your phone", {
          description: "Enter your M-Pesa PIN to complete payment",
        });
      } else {
        setPaymentStep("error");
        setErrorMessage(result.responseDescription || "Failed to initiate payment");
      }
    } catch (error: any) {
      setPaymentStep("error");
      setErrorMessage(error.message || "An error occurred. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Complete Payment</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStep === "input" && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Enter your phone number to receive an M-Pesa payment prompt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="0712 345 678 or +254712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Kenyan format: 0712345678 or +254712345678</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                <p className="text-2xl font-bold text-foreground">{formatKES(amount)}</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white h-11"
                disabled={initiatePayment.isPending}
              >
                {initiatePayment.isPending ? "Sending prompt..." : "Send M-Pesa Prompt"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Cancel
              </Button>
            </form>
          )}

          {paymentStep === "processing" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-spin">
                <Loader className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-2">Processing Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Waiting for M-Pesa confirmation...
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Check your phone for the M-Pesa prompt and enter your PIN
              </p>
            </div>
          )}

          {paymentStep === "success" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-2">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your order has been confirmed and will be prepared shortly.
                </p>
              </div>
            </div>
          )}

          {paymentStep === "error" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Payment Failed</p>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setPaymentStep("input");
                  setPhoneNumber("");
                  setErrorMessage("");
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Try Again
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
