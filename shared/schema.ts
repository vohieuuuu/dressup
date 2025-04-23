import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  fullName: text("full_name"),
  avatar: text("avatar"),
  role: text("role").notNull().default("buyer"), // buyer, seller, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  discountPrice: integer("discount_price"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  sellerId: integer("seller_id").notNull(),
  images: jsonb("images").notNull(), // Array of image URLs
  colors: jsonb("colors"), // Array of color options
  sizes: jsonb("sizes"), // Array of size options
  stock: integer("stock").notNull(),
  rating: integer("rating"),
  reviewCount: integer("review_count"),
  soldCount: integer("sold_count").default(0),
  isFeatured: boolean("is_featured").default(false),
  isFlashSale: boolean("is_flash_sale").default(false),
  flashSaleDiscount: integer("flash_sale_discount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  discountPrice: true,
  category: true,
  subcategory: true,
  sellerId: true,
  images: true,
  colors: true,
  sizes: true,
  stock: true,
  isFeatured: true,
  isFlashSale: true,
  flashSaleDiscount: true,
});

// Seller schema
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  shopName: text("shop_name").notNull(),
  shopType: text("shop_type").notNull(), // individual, small-business, brand
  shopLogo: text("shop_logo"),
  shopBanner: text("shop_banner"),
  shopDescription: text("shop_description"),
  mainCategory: text("main_category"),
  address: text("address"),
  phone: text("phone"),
  isVerified: boolean("is_verified").default(false),
  rating: integer("rating"),
  reviewCount: integer("review_count"),
  productCount: integer("product_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSellerSchema = createInsertSchema(sellers).pick({
  userId: true,
  shopName: true,
  shopType: true,
  shopLogo: true,
  shopBanner: true,
  shopDescription: true,
  mainCategory: true,
  address: true,
  phone: true,
});

// Cart schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  color: text("color"),
  size: text("size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  userId: true,
  productId: true,
  quantity: true,
  color: true,
  size: true,
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, completed, canceled, returned
  totalAmount: integer("total_amount").notNull(),
  shippingFee: integer("shipping_fee"),
  shippingAddress: text("shipping_address").notNull(),
  recipientName: text("recipient_name"),
  recipientPhone: text("recipient_phone"),
  notes: text("notes"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, refunded, failed
  trackingNumber: text("tracking_number"),
  shippingMethod: text("shipping_method"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  isRated: boolean("is_rated").default(false),
  returnRequested: boolean("return_requested").default(false),
  returnReason: text("return_reason"),
  returnStatus: text("return_status"), // pending, approved, rejected, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  sellerId: true,
  totalAmount: true,
  shippingAddress: true,
  paymentMethod: true,
  paymentStatus: true,
  shippingMethod: true,
  recipientName: true,
  recipientPhone: true,
  notes: true,
  shippingFee: true,
});

// Order Item schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  color: text("color"),
  size: text("size"),
  isReviewed: boolean("is_reviewed").default(false),
  rating: integer("rating"),
  reviewText: text("review_text"),
  reviewDate: timestamp("review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
  color: true,
  size: true,
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  image: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = z.infer<typeof insertSellerSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
