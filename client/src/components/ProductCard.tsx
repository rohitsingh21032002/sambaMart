import { Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { motion } from "framer-motion";

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  stock: number;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem, updateQuantity, items, setOpen } = useCart();
  const cartItem = items.find((item) => item.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, quantity - 1);
  };

  // Format price (assuming stored in lowest unit like paisa/cents)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="group relative bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/400x300?text=${encodeURIComponent(product.name)}`;
          }}
        />
        {/* Quick Add Button overlay for mobile optimization */}
        {quantity === 0 && (
          <button 
            onClick={handleAdd}
            className="md:hidden absolute bottom-2 right-2 bg-white/90 backdrop-blur shadow-md p-2 rounded-full text-primary"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-display font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground line-through">
              {/* Fake MRP for visual interest - 20% higher */}
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price * 1.2)}
            </span>
            <span className="font-bold text-lg text-gray-900">{formattedPrice}</span>
          </div>

          {quantity === 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              disabled={product.stock <= 0}
              className={`
                hidden md:inline-flex px-4 py-2 rounded-lg text-sm font-semibold shadow-sm
                ${product.stock > 0 
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-md" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"}
                transition-all duration-200
              `}
            >
              {product.stock > 0 ? "Add" : "Out of Stock"}
            </motion.button>
          ) : (
            <div className="flex items-center bg-primary text-white rounded-lg overflow-hidden shadow-md">
              <button 
                onClick={handleDecrement}
                className="p-2 hover:bg-green-700 transition-colors active:bg-green-800"
              >
                <Minus size={16} strokeWidth={3} />
              </button>
              <span className="w-8 text-center font-bold text-sm">{quantity}</span>
              <button 
                onClick={handleIncrement}
                className="p-2 hover:bg-green-700 transition-colors active:bg-green-800"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
