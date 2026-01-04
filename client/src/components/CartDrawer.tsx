import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Plus, Minus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

export function CartDrawer() {
  const { isOpen, toggleCart, items, updateQuantity, total, itemCount, removeItem } = useCart();

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(total);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                My Cart 
                <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                  {itemCount} items
                </span>
              </h2>
              <button 
                onClick={toggleCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-primary mb-2">
                    <ShoppingBag size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Your cart is empty</h3>
                  <p className="text-muted-foreground text-sm">Looks like you haven't added anything to your cart yet.</p>
                  <button 
                    onClick={toggleCart}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex gap-4 p-3 bg-white border rounded-xl shadow-sm">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/100?text=${item.name[0]}`; }}
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{item.name}</h4>
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="text-gray-400 hover:text-destructive p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-end mt-2">
                        <span className="font-bold text-gray-900">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                        </span>
                        
                        <div className="flex items-center bg-primary text-white rounded-lg overflow-hidden shadow-sm h-8">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-green-700 active:bg-green-800 transition-colors"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-green-700 active:bg-green-800 transition-colors"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 bg-white border-t space-y-4 safe-area-bottom">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Item Total</span>
                    <span>{formattedTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span className="text-primary font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Grand Total</span>
                    <span>{formattedTotal}</span>
                  </div>
                </div>

                <Link href="/checkout" onClick={toggleCart} className="w-full">
                  <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-between px-6 transition-all active:scale-[0.98]">
                    <span>Proceed to Checkout</span>
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <ArrowRight size={20} />
                    </div>
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
