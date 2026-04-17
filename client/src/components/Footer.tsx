import { ChefHat, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-foreground text-white mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Food<span className="text-primary">Bites</span>
              </span>
            </div>
            <p className="text-sm text-white/60 max-w-xs leading-relaxed">
              Delivering the finest culinary experiences from your favourite local restaurants
              straight to your door.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/restaurants", label: "Restaurants" },
                { href: "/orders", label: "My Orders" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cuisines */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
              Cuisines
            </h4>
            <ul className="space-y-2">
              {["Pizza", "Burgers", "Sushi", "Italian", "Chinese"].map((cuisine) => (
                <li key={cuisine}>
                  <Link
                    href={`/restaurants?cuisine=${cuisine}`}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {cuisine}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} FoodBites. All rights reserved.
          </p>
          <p className="text-xs text-white/40 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-primary fill-primary" /> for food lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
