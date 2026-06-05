import { Clock, Star, Truck, UtensilsCrossed, Heart } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "./ui/badge";
import { formatKES } from "@shared/currency";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

interface Restaurant {
  id: number;
  name: string;
  description?: string | null;
  cuisine: string;
  imageUrl?: string | null;
  rating?: string | null;
  reviewCount?: number | null;
  deliveryTime?: string | null;
  deliveryFee?: string | null;
  minOrder?: string | null;
  isOpen?: boolean | null;
  featured?: boolean | null;
}

// Cuisine-based gradient backgrounds for placeholder images
const cuisineGradients: Record<string, string> = {
  Pizza: "from-orange-400 to-red-500",
  Burgers: "from-yellow-400 to-orange-500",
  Sushi: "from-teal-400 to-cyan-500",
  Italian: "from-green-400 to-emerald-500",
  Chinese: "from-red-400 to-pink-500",
  Indian: "from-orange-500 to-yellow-400",
  Mexican: "from-green-500 to-lime-400",
  Thai: "from-purple-400 to-pink-400",
  American: "from-blue-400 to-indigo-500",
  Japanese: "from-rose-400 to-pink-500",
  default: "from-primary/80 to-orange-400",
};

function getCuisineGradient(cuisine: string): string {
  for (const key of Object.keys(cuisineGradients)) {
    if (cuisine.toLowerCase().includes(key.toLowerCase())) {
      return cuisineGradients[key];
    }
  }
  return cuisineGradients.default;
}

// Cuisine emojis
const cuisineEmojis: Record<string, string> = {
  Pizza: "🍕",
  Burgers: "🍔",
  Sushi: "🍣",
  Italian: "🍝",
  Chinese: "🥡",
  Indian: "🍛",
  Mexican: "🌮",
  Thai: "🍜",
  American: "🍟",
  Japanese: "🍱",
  default: "🍽️",
};

function getCuisineEmoji(cuisine: string): string {
  for (const key of Object.keys(cuisineEmojis)) {
    if (cuisine.toLowerCase().includes(key.toLowerCase())) {
      return cuisineEmojis[key];
    }
  }
  return cuisineEmojis.default;
}

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const gradient = getCuisineGradient(restaurant.cuisine);
  const emoji = getCuisineEmoji(restaurant.cuisine);
  const rating = parseFloat(restaurant.rating ?? "0");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Only query bookmark status if user is authenticated
  const { data: bookmarkStatus } = trpc.bookmarks.isBookmarked.useQuery(
    { restaurantId: restaurant.id },
    { enabled: !!restaurant.id && !!user }
  );

  const addBookmarkMutation = trpc.bookmarks.add.useMutation();
  const removeBookmarkMutation = trpc.bookmarks.remove.useMutation();

  useEffect(() => {
    if (bookmarkStatus !== undefined) {
      setIsBookmarked(bookmarkStatus);
    }
  }, [bookmarkStatus]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't allow bookmarking if not authenticated
    if (!user) {
      return;
    }
    
    setIsLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmarkMutation.mutateAsync({ restaurantId: restaurant.id });
        setIsBookmarked(false);
      } else {
        await addBookmarkMutation.mutateAsync({ restaurantId: restaurant.id });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
        {/* Image / Placeholder */}
        <div className="relative h-48 overflow-hidden">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}
            >
              <span className="text-6xl">{emoji}</span>
            </div>
          )}
          
          {/* Bookmark button (only show if authenticated) */}
          {user && (
            <button
              onClick={handleBookmarkClick}
              disabled={isLoading}
              className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-2 hover:bg-white transition-colors disabled:opacity-50"
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
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {restaurant.featured && (
              <Badge className="bg-primary text-white text-xs font-semibold shadow-md">
                Featured
              </Badge>
            )}
            {!restaurant.isOpen && (
              <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                Closed
              </Badge>
            )}
          </div>
          
          {/* Rating badge */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-md">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-foreground">{rating.toFixed(1)}</span>
            {restaurant.reviewCount ? (
              <span className="text-xs text-muted-foreground">({restaurant.reviewCount})</span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
              {restaurant.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 mb-3">
            <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{restaurant.cuisine}</span>
          </div>

          {restaurant.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {restaurant.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{restaurant.deliveryTime ?? "30-45 min"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              <span>
                {parseFloat(restaurant.deliveryFee ?? "0") === 0
                  ? "Free delivery"
                  : `${formatKES(parseFloat(restaurant.deliveryFee ?? "260"))} delivery`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
