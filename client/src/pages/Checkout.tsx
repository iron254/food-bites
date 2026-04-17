import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatKES } from "@shared/currency";
import { CheckCircle2, ChevronRight, MapPin, Phone, User, FileText, ArrowLeft, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";

export default function Checkout() {
  const { items, subtotal, restaurantId, restaurantName, clearCart } = useCart();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const [form, setForm] = useState({
    deliveryName: user?.name ?? "",
    deliveryPhone: "",
    deliveryAddress: "",
    notes: "",
  });

  const deliveryFee = 260; // KES
  const total = subtotal + deliveryFee;

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      setOrderId(data.orderId);
      setShowPaymentModal(true);
    },
    onError: (err) => {
      toast.error("Failed to place order", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    if (!form.deliveryAddress.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    createOrder.mutate({
      restaurantId,
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price.toFixed(2),
        quantity: item.quantity,
      })),
      deliveryAddress: form.deliveryAddress,
      deliveryName: form.deliveryName,
      deliveryPhone: form.deliveryPhone,
      notes: form.notes,
      totalAmount: total.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
    });
  };

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    clearCart();
  };

  // ── Order Confirmation Screen ──────────────────────────────────────────────
  if (orderId && paymentCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </div>
          <h1
            className="text-3xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground mb-2">
            Your order from <span className="font-semibold text-foreground">{restaurantName}</span>{" "}
            has been confirmed and payment received.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Order #{orderId} · Estimated delivery: 30–45 minutes
          </p>

          <div className="bg-white rounded-2xl border border-border p-5 mb-8 text-left">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Delivering to</span>
            </div>
            <p className="text-sm text-muted-foreground">{form.deliveryAddress}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              Track Your Order <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/restaurants")}>
              Continue Ordering
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty Cart Guard ───────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🛒</p>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <Link href="/restaurants">
            <Button>Browse Restaurants</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="py-8 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.02 30) 0%, oklch(0.30 0.08 32) 100%)",
        }}
      >
        <div className="container">
          <div className="flex items-center gap-3">
            <Link href="/cart">
              <button className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Checkout
              </h1>
              <p className="text-white/60 text-sm">{restaurantName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Delivery Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      value={form.deliveryName}
                      onChange={(e) => setForm({ ...form, deliveryName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+254712345678"
                        value={form.deliveryPhone}
                        onChange={(e) => setForm({ ...form, deliveryPhone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Delivery Address
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full delivery address (street, city, zip code)"
                    value={form.deliveryAddress}
                    onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-bold text-foreground mb-5 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Order Notes
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </h2>
                <Textarea
                  placeholder="Any special instructions? (e.g., no onions, extra sauce, ring doorbell)"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 sticky top-24">
                <h3
                  className="text-lg font-bold text-foreground mb-5"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Order Summary
                </h3>

                <div className="space-y-2 mb-4">
                  {items.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatKES(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatKES(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery fee</span>
                    <span className="font-medium">{formatKES(deliveryFee)}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-bold text-base mb-6">
                  <span>Total</span>
                  <span className="text-primary text-lg">{formatKES(total)}</span>
                </div>

                {/* Payment Method Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    Pay securely with M-Pesa. You'll receive a prompt on your phone.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base"
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? "Placing Order..." : `Proceed to Payment · ${formatKES(total)}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  By placing your order, you agree to our terms of service.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Payment Modal */}
      {orderId && (
        <PaymentModal
          orderId={orderId}
          amount={total}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
