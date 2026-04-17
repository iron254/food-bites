import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { Menu, ShoppingCart, User, X, ChefHat, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const navLinks = [
    { href: "/restaurants", label: "Restaurants" },
    { href: "/orders", label: "My Orders" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Food<span className="text-primary">Bites</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">My Orders</Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={() => logout.mutate()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
