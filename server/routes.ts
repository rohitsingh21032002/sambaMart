import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db"; // For seeding
import { categories, products } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const search = req.query.search as string | undefined;
    const products = await storage.getProducts(categoryId, search);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // Categories
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.categories.get.path, async (req, res) => {
    const category = await storage.getCategory(Number(req.params.id));
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  });

  // Orders
  app.post(api.orders.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.orders.create.input.parse(req.body);
      
      let total = 0;
      for (const item of input.items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          total += product.price * item.quantity;
        }
      }
      
      // User ID is string (UUID)
      const userId = (req.user as any).id || (req.user as any)._id || (req.user as any).sub; // Adjust based on passport user object
      // Replit auth strategy usually puts claims in req.user.claims or req.user directly if we deserialized it.
      // My auth/storage.ts upserts user with ID from claims['sub']. 
      // Passport serializeUser/deserializeUser in replitAuth.ts passes the user object.
      // Let's check replitAuth.ts: verify function passes `user` object with claims.
      // upsertUser uses claims['sub'] as ID.
      // So req.user should have claims.
      const realUserId = (req.user as any).claims?.sub; 

      if (!realUserId) {
        return res.status(500).json({ message: "User ID missing in session" });
      }

      const order = await storage.createOrder(realUserId, input, total);
      res.status(201).json(order);
    } catch (e) {
      console.error(e);
       res.status(400).json({ message: "Invalid order request" });
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const realUserId = (req.user as any).claims?.sub;
    const orders = await storage.getOrders(realUserId);
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    const realUserId = (req.user as any).claims?.sub;
    if (order.userId !== realUserId) return res.sendStatus(403);
    res.json(order);
  });

  // User
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.json(null);
    }
  });

  // Simple Seeding
  if (process.env.NODE_ENV !== 'production') {
    const cats = await storage.getCategories();
    if (cats.length === 0) {
      console.log("Seeding data...");
      const [cat1] = await db.insert(categories).values({
        name: "Vegetables & Fruits",
        slug: "veg-fruits",
        imageUrl: "https://placehold.co/100x100?text=Veg"
      }).returning();
      
      const [cat2] = await db.insert(categories).values({
        name: "Dairy & Breakfast",
        slug: "dairy",
        imageUrl: "https://placehold.co/100x100?text=Dairy"
      }).returning();

      await db.insert(products).values([
        {
          name: "Fresh Tomato",
          description: "Locally grown tomatoes",
          price: 40, // 40 rupees
          imageUrl: "https://placehold.co/200x200?text=Tomato",
          categoryId: cat1.id,
          stock: 100
        },
        {
          name: "Amul Milk",
          description: "Fresh milk 500ml",
          price: 30,
          imageUrl: "https://placehold.co/200x200?text=Milk",
          categoryId: cat2.id,
          stock: 50
        }
      ]);
    }
  }

  return httpServer;
}
