import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RestaurantCard from "@/components/RestaurantCard";
import { trpc } from "@/lib/trpc";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Favorites() {
  const { user, isAuthenticated } = useAuth();
  const { data: bookmarks, isLoading } = trpc.bookmarks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to view your favorites</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/restaurants">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Restaurants
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 fill-red-500 text-red-500" />
            <h1 className="text-3xl font-bold">My Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            {bookmarks?.length === 0
              ? "You haven't bookmarked any restaurants yet"
              : `You have ${bookmarks?.length} favorite restaurant${(bookmarks?.length ?? 0) !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Bookmarks Grid */}
        {!isLoading && bookmarks && bookmarks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark: any) => (
              <RestaurantCard key={bookmark.restaurant.id} restaurant={bookmark.restaurant} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && bookmarks && bookmarks.length === 0 && (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Favorites Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start bookmarking restaurants to save your favorites
            </p>
            <Link href="/restaurants">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Browse Restaurants
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
