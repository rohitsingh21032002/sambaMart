import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: any) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setOpen: (open: boolean) => void;
  total: number;
  itemCount: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      total: 0,
      itemCount: 0,

      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find(item => item.productId === product.id);
          let newItems;
          
          if (existingItem) {
            newItems = state.items.map(item => 
              item.productId === product.id 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            newItems = [...state.items, {
              id: product.id,
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: 1,
              imageUrl: product.imageUrl
            }];
          }
          
          return {
            items: newItems,
            total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            itemCount: newItems.reduce((acc, item) => acc + item.quantity, 0)
          };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter(item => item.productId !== productId);
          return {
            items: newItems,
            total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            itemCount: newItems.reduce((acc, item) => acc + item.quantity, 0)
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter(item => item.productId !== productId);
            return {
              items: newItems,
              total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
              itemCount: newItems.reduce((acc, item) => acc + item.quantity, 0)
            };
          }

          const newItems = state.items.map(item => 
            item.productId === productId ? { ...item, quantity } : item
          );
          
          return {
            items: newItems,
            total: newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            itemCount: newItems.reduce((acc, item) => acc + item.quantity, 0)
          };
        });
      },

      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: 'sambamart-cart',
    }
  )
);
