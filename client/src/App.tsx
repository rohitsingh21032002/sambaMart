import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav, DesktopHeader } from "@/components/Navigation";
import { CartDrawer } from "@/components/CartDrawer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Categories from "@/pages/Categories";
import Checkout from "@/pages/Checkout";
import Profile from "@/pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories" component={Categories} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-sans antialiased text-foreground">
          <DesktopHeader />
          
          <main className="md:pt-0">
            <Router />
          </main>
          
          <BottomNav />
          <CartDrawer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
