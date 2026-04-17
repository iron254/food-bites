import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { items, subtotal, restaurantName, removeItem, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-primary" />
          </div>
          <h2
            className="text-2xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added anything yet. Explore our restaurants and find something
            delicious!
          </p>
          <Link href="/restaurants">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              Browse Restaurants <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;

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
            <Link href="/restaurants">
              <button className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Your Cart
              </h1>
              <p className="text-white/60 text-sm">{restaurantName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </h2>
              <button
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear cart
              </button>
            </div>

            {items.map((item) => (
              <div
                key={item.menuItemId}
                className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
              >
                {/* Image placeholder */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🍽️</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                  <p className="text-primary font-semibold text-sm mt-0.5">
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Item total */}
                <div className="text-right min-w-[60px]">
                  <p className="font-bold text-foreground text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
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

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-base mb-6">
                <span>Total</span>
                <span className="text-primary text-lg">${total.toFixed(2)}</span>
              </div>

              {isAuthenticated ? (
                <Link href="/checkout">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base gap-2">
                    Proceed to Checkout <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Sign in to place your order
                  </p>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12"
                    onClick={() => (window.location.href = getLoginUrl())}
                  >
                    Sign In to Checkout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
