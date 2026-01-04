import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { redirectToLogin } from "@/lib/auth-utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, LogOut, User, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { toast } = useToast();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gray-50">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
          <User size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold font-display text-gray-900">Welcome to SambaMart</h2>
        <p className="text-muted-foreground max-w-xs">Log in to view your orders, save addresses, and checkout faster.</p>
        <button
          onClick={() => redirectToLogin(toast)}
          className="w-full max-w-sm bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl transition-all active:scale-95"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-brand-dark text-white p-6 pb-20 pt-12 md:rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="container mx-auto max-w-4xl relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-white/20 overflow-hidden bg-brand-green flex items-center justify-center text-3xl font-bold shadow-lg">
            {user.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{user.username}</h1>
            <p className="text-white/70">Member since {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 -mt-12 relative z-20 space-y-6">
        {/* Quick Stats / Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center py-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <Package size={20} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{orders?.length || 0}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Orders</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center py-6">
             <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2">
              <MapPin size={20} />
            </div>
            <span className="text-2xl font-bold text-gray-900">1</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Addresses</span>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="text-primary" size={20} />
              Recent Orders
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {isLoadingOrders ? (
              <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
            ) : orders?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Package size={32} />
                </div>
                <h3 className="font-medium text-gray-900">No orders yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Your past orders will appear here.</p>
              </div>
            ) : (
              orders?.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-wider">
                        #{order.id.toString().padStart(4, '0')}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(order.createdAt!).toLocaleDateString('en-IN', { 
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase mb-1
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'}`}>
                        {order.status}
                      </span>
                      <p className="font-bold text-gray-900">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    <span className="font-medium text-gray-900">To:</span> {order.address}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={() => logout()}
          className="w-full bg-white text-red-500 border border-red-100 font-bold py-4 rounded-2xl shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}
