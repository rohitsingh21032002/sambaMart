import { useProducts, useCategories } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Link } from "wouter";
import { Search, ArrowRight, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products, isLoading: isLoadingProducts } = useProducts({ search: searchTerm });
  const { data: categories, isLoading: isLoadingCategories } = useCategories();

  return (
    <div className="pb-24 md:pb-8 space-y-8">
      {/* Mobile Location Header */}
      <div className="md:hidden bg-brand-dark text-white p-4 pb-12 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-secondary">SambaMart</h1>
              <div className="flex items-center text-white/80 text-xs mt-1 font-medium">
                <MapPin size={12} className="mr-1" />
                <span>Samba, Jammu & Kashmir</span>
                <span className="mx-2">•</span>
                <Clock size={12} className="mr-1" />
                <span>15 min delivery</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl font-bold border border-white/20">
              SM
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder='Search "milk", "vegetables"...'
              className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Desktop Hero Section (Search & Banner) */}
      <div className="hidden md:block container mx-auto px-4 mt-8">
        <div className="bg-gradient-to-r from-brand-dark to-primary rounded-3xl p-10 text-white relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Groceries delivered in <span className="text-secondary">15 minutes</span>
            </h1>
            <p className="text-white/80 text-lg mb-8 max-w-md">
              Fresh vegetables, daily essentials, and household items delivered to your doorstep in Samba.
            </p>
            
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-secondary/50 shadow-lg text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-10">
        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900">Shop by Category</h2>
            <Link href="/categories" className="text-primary text-sm font-semibold hover:text-green-700 flex items-center">
              See all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {isLoadingCategories ? (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-2xl animate-pulse" />
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-6 lg:grid-cols-8">
              {categories?.slice(0, 8).map((category) => (
                <Link key={category.id} href={`/categories?id=${category.id}`}>
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group"
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-indigo-50 flex items-center justify-center p-2 shadow-sm border border-transparent group-hover:border-primary/20 group-hover:shadow-md transition-all">
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/100?text=${category.name[0]}`; }}
                      />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-center text-gray-700 group-hover:text-primary transition-colors line-clamp-2">
                      {category.name}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Products */}
        <section>
          <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 mb-4">
            {searchTerm ? `Search Results for "${searchTerm}"` : "Featured Items"}
          </h2>
          
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border p-4 space-y-3">
                  <div className="aspect-[4/3] bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="h-8 bg-gray-100 rounded w-1/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {products?.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No products found. Try a different search term.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
