import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@/hooks/use-orders";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { redirectToLogin } from "@/lib/auth-utils";

// Schema for the form
const checkoutSchema = z.object({
  address: z.string().min(5, "Address is too short. Please provide full delivery details."),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { mutate: createOrder, isPending: isSubmitting } = useCreateOrder();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = (data: CheckoutForm) => {
    if (!user) {
      redirectToLogin(toast);
      return;
    }

    createOrder(
      {
        address: data.address,
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      },
      {
        onSuccess: () => {
          clearCart();
          toast({
            title: "Order Placed Successfully! 🎉",
            description: "Your groceries will be delivered in 15 minutes.",
            duration: 5000,
          });
          setLocation("/profile"); // Redirect to profile to see order history
        },
        onError: (error) => {
          toast({
            title: "Failed to place order",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/">
          <button className="bg-primary text-white px-6 py-3 rounded-xl font-medium">Go Shopping</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-display font-bold">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="grid gap-8">
          {/* Order Summary */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-primary" size={20} />
              Order Summary
            </h2>
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.productId} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium text-sm">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center font-bold text-lg">
              <span>Total to Pay</span>
              <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}</span>
            </div>
          </section>

          {/* Delivery Details */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Delivery Details</h2>
            
            {isAuthLoading ? (
              <div className="h-20 bg-gray-100 animate-pulse rounded-xl" />
            ) : !user ? (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                <p className="text-yellow-800 mb-2 font-medium">Please log in to place your order</p>
                <button 
                  onClick={() => redirectToLogin(toast)}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
                >
                  Log In to Continue
                </button>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                  <textarea
                    {...form.register("address")}
                    placeholder="Enter your full street address, landmark, etc."
                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px]"
                  />
                  {form.formState.errors.address && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-primary text-sm">Superfast Delivery</p>
                    <p className="text-green-700 text-xs">Arriving in 15 minutes</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      Placing Order...
                    </span>
                  ) : (
                    "Confirm & Pay"
                  )}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
