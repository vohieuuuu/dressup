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
  // Thay đổi từ giá bán thành giá thuê
  rentalPricePerDay: integer("price").notNull(), // Giá thuê theo ngày
  rentalPricePerWeek: integer("rental_price_per_week"), // Giá thuê theo tuần
  rentalPricePerMonth: integer("rental_price_per_month"), // Giá thuê theo tháng
  depositAmount: integer("deposit_amount"), // Số tiền đặt cọc
  discountPrice: integer("discount_price"), // Giảm giá nếu có
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  sellerId: integer("seller_id").notNull(),
  images: jsonb("images").notNull(), // Array of image URLs
  colors: jsonb("colors"), // Array of color options
  sizes: jsonb("sizes"), // Array of size options
  stock: integer("stock").notNull(), // Số lượng sản phẩm có sẵn để cho thuê
  condition: text("condition").default("Tốt"), // Tình trạng sản phẩm: Mới, Tốt, Trung bình, etc.
  ageInMonths: integer("age_in_months"), // Tuổi của sản phẩm (tính theo tháng)
  availableForRent: boolean("available_for_rent").default(true), // Có sẵn sàng cho thuê không
  timesRented: integer("times_rented").default(0), // Số lần được thuê
  rating: integer("rating"),
  reviewCount: integer("review_count"),
  isFeatured: boolean("is_featured").default(false),
  isFlashSale: boolean("is_flash_sale").default(false),
  flashSaleDiscount: integer("flash_sale_discount"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  rentalPricePerDay: true,
  rentalPricePerWeek: true,
  rentalPricePerMonth: true,
  depositAmount: true,
  discountPrice: true,
  category: true,
  subcategory: true,
  sellerId: true,
  images: true,
  colors: true,
  sizes: true,
  stock: true,
  condition: true,
  ageInMonths: true,
  availableForRent: true,
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
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
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

// Cart schema - Chỉnh sửa cho mô hình thuê đồ
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  color: text("color"),
  size: text("size"),
  // Thêm các trường dành cho thuê
  rentalStartDate: timestamp("rental_start_date"),
  rentalEndDate: timestamp("rental_end_date"),
  rentalDuration: integer("rental_duration"), // Số ngày thuê
  rentalPeriodType: text("rental_period_type"), // 'day', 'week', 'month'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems)
  .pick({
    userId: true,
    productId: true,
    quantity: true,
    color: true,
    size: true,
    // Thêm trường thuê
    rentalStartDate: true,
    rentalEndDate: true,
    rentalDuration: true,
    rentalPeriodType: true,
  })
  // Override cho phép rentalStartDate và rentalEndDate là null
  .extend({
    rentalStartDate: z.date().nullable(),
    rentalEndDate: z.date().nullable(),
  });

// Order schema - Chỉnh sửa cho mô hình thuê đồ
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  // Cập nhật trạng thái đơn hàng thuê
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, rented, returned, completed, canceled, damaged
  totalAmount: integer("total_amount").notNull(), // Tổng số tiền đơn thuê
  depositAmount: integer("deposit_amount"), // Số tiền cọc
  // Thời gian thuê
  rentalStartDate: timestamp("rental_start_date"),
  rentalEndDate: timestamp("rental_end_date"),
  rentalDuration: integer("rental_duration"), // Số ngày thuê
  rentalPeriodType: text("rental_period_type"), // 'day', 'week', 'month'
  // Thông tin giao nhận
  shippingFee: integer("shipping_fee"),
  shippingAddress: text("shipping_address").notNull(),
  recipientName: text("recipient_name"),
  recipientPhone: text("recipient_phone"),
  notes: text("notes"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, partial_refund, full_refund, failed
  // Thông tin vận chuyển
  trackingNumber: text("tracking_number"),
  shippingMethod: text("shipping_method"),
  pickupDate: timestamp("pickup_date"), // Ngày lấy đồ
  returnDate: timestamp("return_date"), // Ngày trả đồ
  // Đánh giá và hoàn trả
  isRated: boolean("is_rated").default(false),
  returnRequested: boolean("return_requested").default(false),
  earlyReturnRequested: boolean("early_return_requested").default(false), // Yêu cầu trả sớm
  returnReason: text("return_reason"),
  returnStatus: text("return_status"), // pending, approved, rejected, completed
  itemConditionOnReturn: text("item_condition_on_return"), // Tình trạng khi trả lại
  // Thông tin về hư hỏng (nếu có)
  damageReported: boolean("damage_reported").default(false),
  damageDescription: text("damage_description"),
  damageFee: integer("damage_fee"), // Phí hư hỏng
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  sellerId: true,
  totalAmount: true,
  depositAmount: true,
  rentalStartDate: true,
  rentalEndDate: true,
  rentalDuration: true,
  rentalPeriodType: true,
  shippingAddress: true,
  paymentMethod: true,
  paymentStatus: true,
  shippingMethod: true,
  recipientName: true,
  recipientPhone: true,
  notes: true,
  shippingFee: true,
});

// Order Item schema - Chỉnh sửa cho mô hình thuê đồ
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // Giá thuê theo kỳ hạn được chọn
  depositAmount: integer("deposit_amount"), // Số tiền cọc theo sản phẩm
  rentalDuration: integer("rental_duration"), // Số ngày thuê
  rentalPeriodType: text("rental_period_type"), // 'day', 'week', 'month'
  rentalStartDate: timestamp("rental_start_date"),
  rentalEndDate: timestamp("rental_end_date"),
  color: text("color"),
  size: text("size"),
  conditionBeforeRental: text("condition_before_rental"), // Tình trạng trước khi thuê
  conditionAfterReturn: text("condition_after_return"), // Tình trạng sau khi trả lại
  damageDescription: text("damage_description"), // Mô tả hư hỏng nếu có
  damageFee: integer("damage_fee"), // Phí hư hỏng theo từng sản phẩm
  // Đánh giá
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
  depositAmount: true,
  rentalDuration: true,
  rentalPeriodType: true,
  rentalStartDate: true,
  rentalEndDate: true,
  color: true,
  size: true,
  conditionBeforeRental: true,
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

// RentalHistory schema - Lịch sử thuê sản phẩm
export const rentalHistory = pgTable("rental_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id").notNull(),
  orderItemId: integer("order_item_id").notNull(),
  rentalStartDate: timestamp("rental_start_date").notNull(),
  rentalEndDate: timestamp("rental_end_date").notNull(),
  actualReturnDate: timestamp("actual_return_date"),
  rentalDuration: integer("rental_duration").notNull(),
  rentalPeriodType: text("rental_period_type").notNull(),
  rentalPrice: integer("rental_price").notNull(),
  depositAmount: integer("deposit_amount"),
  depositReturned: integer("deposit_returned"),
  condition: text("condition").notNull(), // Tình trạng khi trả
  hasDamage: boolean("has_damage").default(false),
  damageDescription: text("damage_description"),
  damageFee: integer("damage_fee"),
  notes: text("notes"),
  isReviewed: boolean("is_reviewed").default(false),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRentalHistorySchema = createInsertSchema(rentalHistory).pick({
  userId: true,
  productId: true,
  orderId: true,
  orderItemId: true,
  rentalStartDate: true,
  rentalEndDate: true,
  rentalDuration: true,
  rentalPeriodType: true,
  rentalPrice: true,
  depositAmount: true,
  condition: true,
});

// RentalReservation schema - Đặt lịch thuê sản phẩm trước
export const rentalReservation = pgTable("rental_reservation", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  duration: integer("duration").notNull(),
  periodType: text("period_type").notNull(), // 'day', 'week', 'month'
  status: text("status").notNull().default("pending"), // pending, confirmed, canceled, completed
  requestedDeliveryTime: timestamp("requested_delivery_time"),
  deliveryAddress: text("delivery_address").notNull(),
  specialRequests: text("special_requests"),
  depositAmount: integer("deposit_amount"),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRentalReservationSchema = createInsertSchema(rentalReservation).pick({
  userId: true,
  productId: true,
  startDate: true,
  endDate: true,
  duration: true,
  periodType: true,
  deliveryAddress: true,
  specialRequests: true,
  requestedDeliveryTime: true,
  totalAmount: true,
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

export type RentalHistory = typeof rentalHistory.$inferSelect;
export type InsertRentalHistory = z.infer<typeof insertRentalHistorySchema>;

export type RentalReservation = typeof rentalReservation.$inferSelect;
export type InsertRentalReservation = z.infer<typeof insertRentalReservationSchema>;
