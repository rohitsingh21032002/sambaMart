import { db } from "./db";
import {
  users, products, categories, orders, orderItems,
  type User, type InsertUser, type Product, type Category, type Order, type OrderItem, type CreateOrderRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // Auth module uses email mostly but we might need this
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(categoryId?: number, search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;

  // Orders
  createOrder(userId: string, request: CreateOrderRequest, totalAmount: number): Promise<Order>;
  getOrders(userId: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Replit auth uses email or external ID, this might not be used much unless we query by email
    // users table has email, not username in the auth schema
    // But I'll leave it returning undefined or query by email if needed.
    // The auth module handles user creation/lookup mostly.
    return undefined; 
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProducts(categoryId?: number, search?: string): Promise<Product[]> {
    if (categoryId) {
      return await db.select().from(products).where(eq(products.categoryId, categoryId));
    }
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createOrder(userId: string, request: CreateOrderRequest, totalAmount: number): Promise<Order> {
    const [order] = await db.insert(orders).values({
      userId,
      totalAmount,
      address: request.address,
      status: "pending"
    }).returning();

    for (const item of request.items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        });
      }
    }

    return order;
  }

  async getOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
}

export const storage = new DatabaseStorage();
