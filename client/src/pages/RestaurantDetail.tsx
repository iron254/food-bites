import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { formatKES } from "@shared/currency";
import {
  ArrowLeft,
  Clock,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  UtensilsCrossed,
  Flame,
  Heart,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface MenuItem {
  id: number;
  restaurantId: number;
  categoryId?: number | null;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  isAvailable?: boolean | null;
  isPopular?: boolean | null;
}

interface MenuCategory {
  id: number;
  name: string;
  sortOrder?: number | null;
}

function MenuItemCard({
  item,
  restaurantId,
  restaurantName,
}: {
  item: MenuItem;
  restaurantId: number;
  restaurantName: string;
}) {
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);
  const cartItem = items.find((i) => i.menuItemId === item.id);
  const price = parseFloat(item.price);

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price,
      quantity: qty,
      restaurantId,
      restaurantName,
    });
    toast.success(`${item.name} added to cart`, {
      description: `${qty} × ${formatKES(price)}`,
    });
    setQty(1);
  };

  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
      {/* Image placeholder */}
      <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">🍽️</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground text-sm leading-tight">{item.name}</h4>
              {item.isPopular && (
                <Badge className="bg-orange-100 text-orange-700 text-xs px-2 py-0 gap-1 border-0">
                  <Flame className="w-3 h-3" /> Popular
                </Badge>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
            )}
            <p className="text-base font-bold text-primary">{formatKES(price)}</p>
          </div>
        </div>

        {/* Quantity + Add */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1 bg-secondary rounded-lg">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 text-white h-7 text-xs px-3 gap-1"
          >
            <Plus className="w-3 h-3" />
            Add {cartItem ? `(${cartItem.quantity})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const { totalItems, subtotal, restaurantId: cartRestaurantId } = useCart();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  const { data: bookmarkStatus } = trpc.bookmarks.isBookmarked.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  const addBookmarkMutation = trpc.bookmarks.add.useMutation();
  const removeBookmarkMutation = trpc.bookmarks.remove.useMutation();

  useEffect(() => {
    if (bookmarkStatus !== undefined) {
      setIsBookmarked(bookmarkStatus);
    }
  }, [bookmarkStatus]);

  const handleBookmarkClick = async () => {
    setIsBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmarkMutation.mutateAsync({ restaurantId });
        setIsBookmarked(false);
      } else {
        await addBookmarkMutation.mutateAsync({ restaurantId });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const { data: restaurant, isLoading: loadingRestaurant } = trpc.restaurants.getById.useQuery(
    { id: restaurantId },
    { enabled: !!restaurantId }
  );

  const { data: categories } = trpc.menu.getCategories.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  const { data: menuItems, isLoading: loadingMenu } = trpc.menu.getItems.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-64 bg-muted animate-pulse" />
        <div className="container py-8 space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🏪</p>
          <h2 className="text-xl font-semibold mb-2">Restaurant not found</h2>
          <Link href="/restaurants">
            <Button>Back to Restaurants</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Group menu items by category
  const categoryMap = new Map<number | null, MenuItem[]>();
  const uncategorized: MenuItem[] = [];

  if (menuItems) {
    for (const item of menuItems) {
      if (item.categoryId) {
        if (!categoryMap.has(item.categoryId)) categoryMap.set(item.categoryId, []);
        categoryMap.get(item.categoryId)!.push(item);
      } else {
        uncategorized.push(item);
      }
    }
  }

  const rating = parseFloat(restaurant.rating ?? "0");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <span className="text-8xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate("/restaurants")}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Status badge and bookmark */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <button
            onClick={handleBookmarkClick}
            disabled={isBookmarkLoading}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-md disabled:opacity-50"
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isBookmarked
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            />
          </button>
          <Badge
            className={
              restaurant.isOpen
                ? "bg-green-500 text-white"
                : "bg-gray-500 text-white"
            }
          >
            {restaurant.isOpen ? "Open Now" : "Closed"}
          </Badge>
        </div>

        {/* Restaurant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1
            className="text-2xl md:text-3xl font-bold text-white mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {restaurant.name}
          </h1>
            <div className="flex items-center gap-3 text-white/80 text-sm flex-wrap">
              <div className="flex items-center gap-1">
                <UtensilsCrossed className="w-4 h-4" />
                {restaurant.cuisine}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {rating.toFixed(1)}
                {restaurant.reviewCount ? (
                  <span className="text-white/60">({restaurant.reviewCount} reviews)</span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {restaurant.deliveryTime}
              </div>
              <div className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                {parseFloat(restaurant.deliveryFee ?? "0") === 0
                  ? "Free delivery"
                  : `${formatKES(parseFloat(restaurant.deliveryFee ?? "260"))} delivery`}
              </div>
            </div>
        </div>
      </div>

      {/* Description */}
      {restaurant.description && (
        <div className="bg-white border-b border-border">
          <div className="container py-4">
            <p className="text-sm text-muted-foreground">{restaurant.description}</p>
          </div>
        </div>
      )}

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Menu */}
          <div className="flex-1 min-w-0">
            {loadingMenu ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : menuItems && menuItems.length > 0 ? (
              <div className="space-y-10">
                {/* Categorized items */}
                {categories?.map((cat: MenuCategory) => {
                  const items = categoryMap.get(cat.id) ?? [];
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <h2
                        className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {cat.name}
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {items.map((item: MenuItem) => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            restaurantId={restaurant.id}
                            restaurantName={restaurant.name}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Uncategorized items */}
                {uncategorized.length > 0 && (
                  <div>
                    <h2
                      className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Menu
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {uncategorized.map((item: MenuItem) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          restaurantId={restaurant.id}
                          restaurantName={restaurant.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🍽️</p>
                <p className="text-muted-foreground">No menu items available yet.</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar (desktop) */}
          {totalItems > 0 && cartRestaurantId === restaurantId && (
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 bg-white rounded-2xl border border-border shadow-lg p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Your Order
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatKES(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium">
                      {formatKES(parseFloat(restaurant.deliveryFee ?? "260"))}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatKES(subtotal + parseFloat(restaurant.deliveryFee ?? "260"))}
                    </span>
                  </div>
                </div>
                <Link href="/cart">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    View Cart ({totalItems})
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile cart bar */}
      {totalItems > 0 && cartRestaurantId === restaurantId && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-lg">
          <Link href="/cart">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base">
              <ShoppingCart className="w-5 h-5 mr-2" />
              View Cart ({totalItems}) · {formatKES(subtotal)}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
