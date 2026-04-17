import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ChevronRight, Clock, Package, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKES } from "@shared/currency";

const STATUS_CONFIG = {
  placed: { label: "Order Placed", color: "bg-blue-100 text-blue-700", emoji: "📋" },
  preparing: { label: "Preparing", color: "bg-yellow-100 text-yellow-700", emoji: "👨‍🍳" },
  on_the_way: { label: "On the Way", color: "bg-orange-100 text-orange-700", emoji: "🛵" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700", emoji: "✅" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", emoji: "❌" },
} as const;

export default function OrderHistory() {
  const { isAuthenticated, loading } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="py-10 text-white"
          style={{
            background: "linear-gradient(135deg, oklch(0.18 0.02 30) 0%, oklch(0.30 0.08 32) 100%)",
          }}
        >
          <div className="container">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Orders
            </h1>
          </div>
        </div>
        <div className="container py-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Package className="w-10 h-10 text-primary" />
          </div>
          <h2
            className="text-2xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Sign in to view orders
          </h2>
          <p className="text-muted-foreground mb-6">
            Track your current orders and view your order history.
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="py-10 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.02 30) 0%, oklch(0.30 0.08 32) 100%)",
        }}
      >
        <div className="container">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            My Orders
          </h1>
          <p className="text-white/60 text-sm">
            {orders ? `${orders.length} order${orders.length !== 1 ? "s" : ""} total` : ""}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {!orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <ShoppingBag className="w-10 h-10 text-primary" />
            </div>
            <h3
              className="text-xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              No orders yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Your order history will appear here once you place your first order.
            </p>
            <Link href="/restaurants">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Start Ordering
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.placed;
              const date = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const time = new Date(order.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">{status.emoji}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground text-sm">
                              Order #{order.id}
                            </span>
                            <Badge className={`${status.color} text-xs border-0 px-2 py-0`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {date} at {time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {order.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-foreground text-sm">
                            {formatKES(parseFloat(order.totalAmount))}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
