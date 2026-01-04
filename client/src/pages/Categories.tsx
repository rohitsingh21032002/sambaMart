import { useCategories, useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Categories() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCatId = searchParams.get('id');
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCatId ? Number(initialCatId) : null);
  
  const { data: categories, isLoading: isCatsLoading } = useCategories();
  const { data: products, isLoading: isProdsLoading } = useProducts({ 
    categoryId: selectedCategory || undefined 
  });

  // Effect to handle URL param changes if navigating directly
  useEffect(() => {
    if (initialCatId) setSelectedCategory(Number(initialCatId));
    else if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [initialCatId, categories]);

  if (isCatsLoading) {
    return <div className="p-8 text-center">Loading categories...</div>;
  }

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Sidebar for Categories - Mobile: Horizontal Scroll, Desktop: Vertical Sidebar */}
      <div className="w-full md:w-64 bg-white md:border-r flex-shrink-0 z-10 shadow-sm md:shadow-none">
        <div className="p-4 md:p-6 border-b md:border-b-0">
          <h1 className="text-xl md:text-2xl font-display font-bold text-gray-900">Categories</h1>
        </div>
        
        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0 h-full md:h-[calc(100%-80px)] px-2 md:px-0">
          {categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex flex-col md:flex-row items-center md:items-start p-2 md:px-6 md:py-4 transition-all whitespace-nowrap md:whitespace-normal
                min-w-[80px] md:min-w-0 flex-shrink-0 md:flex-shrink
                ${selectedCategory === category.id 
                  ? "md:bg-green-50 text-primary border-b-2 md:border-b-0 md:border-r-4 border-primary" 
                  : "text-gray-600 hover:bg-gray-50 border-transparent"}
              `}
            >
              <div className={`
                w-12 h-12 md:w-8 md:h-8 rounded-full mb-2 md:mb-0 md:mr-3 overflow-hidden flex items-center justify-center bg-gray-100
                ${selectedCategory === category.id ? "ring-2 ring-primary ring-offset-2" : ""}
              `}>
                <img 
                  src={category.imageUrl} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/100?text=${category.name[0]}`; }}
                />
              </div>
              <span className={`text-xs md:text-sm font-medium ${selectedCategory === category.id ? "font-bold" : ""}`}>
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Products Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">
              {categories?.find(c => c.id === selectedCategory)?.name || "All Products"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {products?.length || 0} items found
            </p>
          </div>

          {isProdsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products?.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
          
          {products?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p>No products available in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
