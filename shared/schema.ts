import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

// === Categories ===
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url").notNull(),
});

// === Products ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in lowest currency unit (e.g. rupees/paise)
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  stock: integer("stock").notNull().default(0),
});

// === Orders ===
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // UUID from auth
  status: text("status").notNull().default("pending"),
  totalAmount: integer("total_amount").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Order Items ===
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});

// === Relations ===
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// === Schemas ===
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, userId: true, totalAmount: true, status: true });

// Explicit Types
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type CartItem = {
  productId: number;
  quantity: number;
};

export type CreateOrderRequest = {
  address: string;
  items: CartItem[];
};
