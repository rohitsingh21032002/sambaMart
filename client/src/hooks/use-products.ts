import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Types from schema
type Product = z.infer<typeof api.products.list.responses[200]>[0];
type Category = z.infer<typeof api.categories.list.responses[200]>[0];

export function useProducts(filters?: { categoryId?: number; search?: string }) {
  // Construct query string manually since URLSearchParams handles undefined oddly sometimes
  const queryKey = [api.products.list.path, filters?.categoryId, filters?.search];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.products.list.path, window.location.origin);
      if (filters?.categoryId) url.searchParams.append("categoryId", String(filters.categoryId));
      if (filters?.search) url.searchParams.append("search", filters.search);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch products");
      
      const data = await res.json();
      return api.products.list.responses[200].parse(data);
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      
      const data = await res.json();
      return api.products.get.responses[200].parse(data);
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      
      const data = await res.json();
      return api.categories.list.responses[200].parse(data);
    },
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: [api.categories.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.categories.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch category");
      
      const data = await res.json();
      return api.categories.get.responses[200].parse(data);
    },
  });
}
