import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Clock,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  {
    key: "placed",
    label: "Order Placed",
    description: "Your order has been received",
    icon: Package,
    emoji: "📋",
  },
  {
    key: "preparing",
    label: "Preparing",
    description: "The kitchen is preparing your food",
    icon: ChefHat,
    emoji: "👨‍🍳",
  },
  {
    key: "on_the_way",
    label: "On the Way",
    description: "Your order is out for delivery",
    icon: Truck,
    emoji: "🛵",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Enjoy your meal!",
    icon: CheckCircle2,
    emoji: "✅",
  },
] as const;

const STATUS_ORDER = ["placed", "preparing", "on_the_way", "delivered"] as const;

function getStepIndex(status: string): number {
  return STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
}

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id ?? "0");
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = trpc.orders.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId && isAuthenticated, refetchInterval: 15000 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-48 bg-muted animate-pulse" />
        <div className="container py-8 space-y-4">
          <div className="h-32 bg-muted rounded-2xl animate-pulse" />
          <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-semibold mb-2">Order not found</h2>
          <Link href="/orders">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { order, restaurant, items } = data;
  const currentStatus = order.status;
  const currentStepIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
          <div className="flex items-center gap-3 mb-4">
            <Link href="/orders">
              <button className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Order #{order.id}
              </h1>
              <p className="text-white/60 text-sm">
                {orderDate} at {orderTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold text-foreground mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Order Status
              </h2>

              {isCancelled ? (
                <div className="text-center py-6">
                  <p className="text-5xl mb-3">❌</p>
                  <p className="font-semibold text-foreground">Order Cancelled</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This order has been cancelled.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
                  <div
                    className="absolute left-6 top-6 w-0.5 bg-primary transition-all duration-700"
                    style={{
                      height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                    }}
                  />

                  <div className="space-y-8">
                    {STEPS.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex items-start gap-5 relative">
                          {/* Step circle */}
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 ${
                              isCompleted
                                ? "bg-primary shadow-lg shadow-primary/30"
                                : "bg-muted border-2 border-border"
                            } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                          >
                            {isCompleted ? (
                              <span className="text-xl">{step.emoji}</span>
                            ) : (
                              <Icon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* Step content */}
                          <div className="flex-1 pt-2">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-semibold text-sm ${
                                  isCompleted ? "text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {step.label}
                              </p>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  Current
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs mt-0.5 ${
                                isCompleted ? "text-muted-foreground" : "text-muted-foreground/50"
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Delivery Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-muted-foreground w-24 flex-shrink-0">Address</span>
                  <span className="text-foreground font-medium">{order.deliveryAddress}</span>
                </div>
                {order.deliveryName && (
                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-24 flex-shrink-0">Name</span>
                    <span className="text-foreground font-medium">{order.deliveryName}</span>
                  </div>
                )}
                {order.deliveryPhone && (
                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-24 flex-shrink-0">Phone</span>
                    <span className="text-foreground font-medium">{order.deliveryPhone}</span>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-24 flex-shrink-0">ETA</span>
                    <span className="text-foreground font-medium">{order.estimatedDelivery}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="flex gap-3">
                    <span className="text-muted-foreground w-24 flex-shrink-0">Notes</span>
                    <span className="text-foreground">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <h3
                className="font-bold text-foreground mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {restaurant?.name ?? "Restaurant"}
              </h3>

              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-3" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    ${(parseFloat(order.totalAmount) - parseFloat(order.deliveryFee ?? "2.99")).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span>${parseFloat(order.deliveryFee ?? "2.99").toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">${parseFloat(order.totalAmount).toFixed(2)}</span>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <Link href="/restaurants">
                  <Button variant="outline" className="w-full text-sm">
                    Order Again
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
