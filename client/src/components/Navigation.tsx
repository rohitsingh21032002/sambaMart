import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { motion, AnimatePresence } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();
  const { itemCount, toggleCart } = useCart();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/categories", icon: Grid, label: "Categories" },
    { action: toggleCart, icon: ShoppingBag, label: "Cart", isCart: true },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl pb-safe pt-2 px-6 pb-2 md:hidden">
      <div className="flex justify-between items-center">
        {navItems.map((item, index) => {
          const isActive = item.href === location;
          const Icon = item.icon;
          
          if (item.action) {
            return (
              <button
                key={index}
                onClick={item.action}
                className="flex flex-col items-center justify-center space-y-1 relative w-16"
              >
                <div className="relative">
                  <Icon 
                    size={24} 
                    className={item.isCart && itemCount > 0 ? "text-primary" : "text-gray-400"}
                  />
                  <AnimatePresence>
                    {item.isCart && itemCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white"
                      >
                        {itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-xs font-medium text-gray-500">{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={index} href={item.href!} className="flex flex-col items-center justify-center space-y-1 w-16">
              <Icon 
                size={24} 
                className={`transition-colors duration-200 ${isActive ? "text-primary fill-primary/10" : "text-gray-400"}`}
              />
              <span className={`text-xs font-medium transition-colors duration-200 ${isActive ? "text-primary" : "text-gray-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DesktopHeader() {
  const { itemCount, toggleCart } = useCart();
  const [location] = useLocation();

  return (
    <header className="hidden md:block sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-secondary rounded-lg p-1.5">
            <ShoppingBag className="text-secondary-foreground h-6 w-6" />
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-primary">SambaMart</span>
        </Link>

        <nav className="flex items-center space-x-8">
          <Link 
            href="/" 
            className={`text-sm font-medium hover:text-primary transition-colors ${location === "/" ? "text-primary" : "text-muted-foreground"}`}
          >
            Home
          </Link>
          <Link 
            href="/categories" 
            className={`text-sm font-medium hover:text-primary transition-colors ${location.startsWith("/categories") ? "text-primary" : "text-muted-foreground"}`}
          >
            Categories
          </Link>
          <Link 
            href="/profile" 
            className={`text-sm font-medium hover:text-primary transition-colors ${location === "/profile" ? "text-primary" : "text-muted-foreground"}`}
          >
            Account
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleCart}
            className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-primary px-4 py-2 rounded-xl transition-colors font-semibold"
          >
            <ShoppingBag size={20} />
            <span>{itemCount} items</span>
          </button>
        </div>
      </div>
    </header>
  );
}
