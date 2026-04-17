import RestaurantCard from "@/components/RestaurantCard";
import { trpc } from "@/lib/trpc";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const CUISINES = ["All", "Pizza", "Burgers", "Sushi", "Italian", "Chinese", "Indian", "Mexican", "Thai", "American", "Japanese"];
const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "delivery", label: "Fastest Delivery" },
  { value: "fee", label: "Lowest Fee" },
];

export default function Restaurants() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [activeCuisine, setActiveCuisine] = useState(params.get("cuisine") ?? "All");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: restaurants, isLoading } = trpc.restaurants.list.useQuery({
    search: debouncedSearch || undefined,
    cuisine: activeCuisine === "All" ? undefined : activeCuisine,
    limit: 50,
  });

  const clearFilters = () => {
    setSearch("");
    setActiveCuisine("All");
  };

  const hasFilters = search || activeCuisine !== "All";

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
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            All Restaurants
          </h1>
          <p className="text-white/60 text-sm">
            {restaurants ? `${restaurants.length} restaurants available` : "Exploring options..."}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants or cuisines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-11 gap-2">
              <X className="w-4 h-4" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Cuisine Pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setActiveCuisine(cuisine)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCuisine === cuisine
                  ? "bg-primary text-white shadow-md"
                  : "bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>

        {/* Active filters display */}
        {hasFilters && (
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {search && (
              <Badge variant="secondary" className="gap-1">
                Search: "{search}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch("")} />
              </Badge>
            )}
            {activeCuisine !== "All" && (
              <Badge variant="secondary" className="gap-1">
                {activeCuisine}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveCuisine("All")} />
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants && restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold text-foreground mb-2">No restaurants found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button onClick={clearFilters}>Clear all filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}
