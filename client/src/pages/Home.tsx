import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import RestaurantCard from "@/components/RestaurantCard";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ChevronRight, Clock, Search, Shield, Star, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { label: "All", emoji: "🍽️" },
  { label: "Pizza", emoji: "🍕" },
  { label: "Burgers", emoji: "🍔" },
  { label: "Sushi", emoji: "🍣" },
  { label: "Italian", emoji: "🍝" },
  { label: "Chinese", emoji: "🥡" },
  { label: "Indian", emoji: "🍛" },
  { label: "Mexican", emoji: "🌮" },
  { label: "Thai", emoji: "🍜" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: featuredRestaurants, isLoading } = trpc.restaurants.list.useQuery({
    featured: true,
    limit: 6,
  });

  const { data: allRestaurants } = trpc.restaurants.list.useQuery({
    cuisine: activeCategory === "All" ? undefined : activeCategory,
    limit: 8,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/restaurants");
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.18 0.02 30) 0%, oklch(0.30 0.08 32) 60%, oklch(0.25 0.06 20) 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-orange-400/10 blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="container relative py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-primary/20 text-orange-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Fast Delivery · Fresh Food · Great Taste
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Delicious Food,{" "}
              <span className="text-primary">Delivered</span>{" "}
              to Your Door
            </h1>

            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Discover the finest restaurants in your city and enjoy restaurant-quality meals
              from the comfort of your home.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white border-0 rounded-xl text-foreground placeholder:text-muted-foreground shadow-lg"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg"
              >
                Search
              </Button>
            </form>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: "🏪", value: "50+", label: "Restaurants" },
                { icon: "⚡", value: "30 min", label: "Avg. Delivery" },
                { icon: "⭐", value: "4.8", label: "Avg. Rating" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
                    <p className="text-white/50 text-xs">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Filter ───────────────────────────────────────────────── */}
      <section className="bg-white border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="container">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.label
                    ? "bg-primary text-white shadow-md scale-105"
                    : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Restaurants ──────────────────────────────────────────── */}
      {featuredRestaurants && featuredRestaurants.length > 0 && (
        <section className="py-14 bg-background">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold text-foreground"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Featured Restaurants
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Hand-picked favourites our customers love
                </p>
              </div>
              <Link href="/restaurants">
                <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRestaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Browse by Category ────────────────────────────────────────────── */}
      <section className="py-14 bg-secondary/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold text-foreground"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {activeCategory === "All" ? "All Restaurants" : `${activeCategory} Restaurants`}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {activeCategory === "All"
                  ? "Explore all available restaurants"
                  : `Best ${activeCategory} near you`}
              </p>
            </div>
            <Link href={`/restaurants${activeCategory !== "All" ? `?cuisine=${activeCategory}` : ""}`}>
              <Button variant="ghost" className="text-primary hover:text-primary/80 gap-1">
                See all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
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
          ) : allRestaurants && allRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allRestaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🍽️</p>
              <p className="text-muted-foreground text-lg">No restaurants found for this category.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveCategory("All")}
              >
                View all restaurants
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2
              className="text-2xl md:text-3xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              How It Works
            </h2>
            <p className="text-muted-foreground">Three simple steps to your perfect meal</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-7 h-7 text-primary" />,
                title: "Browse & Choose",
                desc: "Explore hundreds of restaurants and menus. Filter by cuisine, rating, or delivery time.",
              },
              {
                icon: <Truck className="w-7 h-7 text-primary" />,
                title: "Place Your Order",
                desc: "Add items to your cart, enter your address, and confirm your order in seconds.",
              },
              {
                icon: <Star className="w-7 h-7 text-primary" />,
                title: "Enjoy Your Meal",
                desc: "Track your order in real-time and enjoy fresh, delicious food at your doorstep.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                  {step.icon}
                </div>
                <div className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section
          className="py-16"
          style={{
            background: "linear-gradient(135deg, oklch(0.62 0.22 32) 0%, oklch(0.55 0.18 25) 100%)",
          }}
        >
          <div className="container text-center">
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to Order?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Sign in to place orders, track deliveries, and save your favourites.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 h-12 rounded-xl shadow-lg"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* ── Trust Badges ─────────────────────────────────────────────────── */}
      <section className="py-12 bg-secondary/20 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-6 h-6 text-primary" />,
                title: "Fast Delivery",
                desc: "Average delivery time under 35 minutes",
              },
              {
                icon: <Shield className="w-6 h-6 text-primary" />,
                title: "Safe & Secure",
                desc: "Your data and payments are fully protected",
              },
              {
                icon: <Star className="w-6 h-6 text-primary" />,
                title: "Top Rated",
                desc: "Thousands of 5-star reviews from happy customers",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
