import { z } from 'zod';
import { insertUserSchema, insertProductSchema, insertCategorySchema, users, products, categories, orders } from './schema';

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        categoryId: z.coerce.number().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/categories/:id',
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    }
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: z.object({
        address: z.string(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().min(1)
        }))
      }),
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        401: z.object({ message: z.string() }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id',
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
      }
    }
  },
  // Auth routes are handled by passport/auth.ts but we can document user info endpoint
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>().nullable(), // Returns null if not logged in
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
