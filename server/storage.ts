import { 
  User, InsertUser, 
  Product, InsertProduct, 
  Seller, InsertSeller, 
  CartItem, InsertCartItem, 
  Order, InsertOrder, 
  OrderItem, InsertOrderItem,
  Category, InsertCategory,
  users, products, sellers, cartItems, orders, orderItems, categories
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, like, desc, asc, or, isNull, isNotNull, gt, sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.SessionStore;
  
  // Để debug, lộ Map orders ra
  orders: Map<number, Order>;
  
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<void>;
  getUsers(): Promise<User[]>;
  
  // Product
  getProducts(filters?: { category?: string, search?: string, flashSale?: boolean, featured?: boolean, showOutOfStock?: boolean }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getProductsBySeller(sellerId: number): Promise<Product[]>;
  
  // Seller
  getSeller(id: number): Promise<Seller | undefined>;
  getSellerByUserId(userId: number): Promise<Seller | undefined>;
  createSeller(seller: InsertSeller): Promise<Seller>;
  getSellers(): Promise<Seller[]>;
  
  // Cart
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, userId: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number, userId: number): Promise<void>;
  
  // Order
  getOrders(userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]>;
  getOrdersBySeller(sellerId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder, items: { productId: number, quantity: number, color?: string, size?: string }[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  updatePaymentStatus(id: number, status: string): Promise<Order>;
  updateTrackingInfo(id: number, data: { trackingNumber?: string, shippingMethod?: string, estimatedDelivery?: Date }): Promise<Order>;
  markOrderDelivered(id: number): Promise<Order>;
  // Buyer confirmation
  confirmOrderDelivery(id: number): Promise<Order>;
  // Return management
  requestReturn(orderId: number, reason: string): Promise<Order>;
  processReturn(orderId: number, status: string): Promise<Order>;
  // Reviews
  addReview(orderItemId: number, data: { rating: number, reviewText: string }): Promise<OrderItem>;
  
  // Category
  getCategories(): Promise<Category[]>;
  
  // Demo data
  initDemoData(): Promise<void>;
}

export class MemStorage implements IStorage {
  public users: Map<number, User>;
  public products: Map<number, Product>;
  public sellers: Map<number, Seller>;
  public cartItems: Map<number, CartItem>;
  public orders: Map<number, Order>;
  public orderItems: Map<number, OrderItem>;
  public categories: Map<number, Category>;
  
  sessionStore: session.SessionStore;
  currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.sellers = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.categories = new Map();
    
    this.currentId = {
      users: 1,
      products: 1,
      sellers: 1,
      cartItems: 1,
      orders: 1,
      orderItems: 1,
      categories: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserRole(userId: number, role: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.role = role;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async getProducts(filters?: { category?: string, search?: string, flashSale?: boolean, featured?: boolean }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    // Lọc các sản phẩm đã hết hàng
    products = products.filter(p => p.stock > 0);
    
    if (filters) {
      if (filters.category) {
        // Get all categories to find the one with matching slug
        const categories = await this.getCategories();
        const matchingCategory = categories.find(c => c.slug === filters.category);
        
        if (matchingCategory) {
          // Filter products by category name
          products = products.filter(p => 
            p.category.toLowerCase() === matchingCategory.name.toLowerCase() ||
            (p.subcategory && p.subcategory.toLowerCase().includes(matchingCategory.name.toLowerCase()))
          );
        } else {
          // If no matching category found, try direct comparison with category and subcategory
          const categoryLower = filters.category.toLowerCase();
          products = products.filter(p => 
            p.category.toLowerCase() === categoryLower ||
            p.category.toLowerCase().includes(categoryLower) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(categoryLower))
          );
        }
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          p.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.flashSale) {
        products = products.filter(p => p.isFlashSale);
      }
      
      if (filters.featured) {
        products = products.filter(p => p.isFeatured);
      }
      
      // Nếu là admin hoặc seller xem sản phẩm của họ, hiển thị cả sản phẩm hết hàng
      if (filters.showOutOfStock) {
        products = Array.from(this.products.values());
        // Tiếp tục áp dụng các bộ lọc khác
      }
    }
    
    return products;
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId.products++;
    const now = new Date();
    const product: Product = {
      ...insertProduct,
      id,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.products.set(id, product);
    
    // Update seller product count
    const seller = await this.getSeller(insertProduct.sellerId);
    if (seller) {
      seller.productCount = (seller.productCount || 0) + 1;
      this.sellers.set(seller.id, seller);
    }
    
    return product;
  }
  
  async updateProduct(id: number, productUpdate: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error("Product not found");
    }
    
    const updatedProduct: Product = {
      ...product,
      ...productUpdate,
      id,
      updatedAt: new Date()
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error("Product not found");
    }
    
    this.products.delete(id);
    
    // Update seller product count
    const seller = await this.getSeller(product.sellerId);
    if (seller) {
      seller.productCount = Math.max(0, (seller.productCount || 1) - 1);
      this.sellers.set(seller.id, seller);
    }
  }
  
  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    // Hiển thị tất cả sản phẩm của người bán, bao gồm cả sản phẩm hết hàng
    return Array.from(this.products.values()).filter(p => p.sellerId === sellerId);
  }

  // Seller methods
  async getSeller(id: number): Promise<Seller | undefined> {
    return this.sellers.get(id);
  }
  
  async getSellerByUserId(userId: number): Promise<Seller | undefined> {
    return Array.from(this.sellers.values()).find(s => s.userId === userId);
  }
  
  async createSeller(insertSeller: InsertSeller): Promise<Seller> {
    const id = this.currentId.sellers++;
    const now = new Date();
    
    // Giữ lại các thuộc tính nếu đã được cung cấp
    const rating = 'rating' in insertSeller ? insertSeller.rating as number : 0;
    const reviewCount = 'reviewCount' in insertSeller ? insertSeller.reviewCount as number : 0;
    const productCount = 'productCount' in insertSeller ? insertSeller.productCount as number : 0;
    const isVerified = 'isVerified' in insertSeller ? insertSeller.isVerified as boolean : false;
    
    const seller: Seller = {
      ...insertSeller,
      id,
      isVerified: isVerified,
      rating: rating,
      reviewCount: reviewCount,
      productCount: productCount,
      createdAt: now,
      updatedAt: now
    };
    this.sellers.set(id, seller);
    return seller;
  }
  
  async getSellers(): Promise<Seller[]> {
    return Array.from(this.sellers.values());
  }

  // Cart methods
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const cartItems = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
    
    return Promise.all(cartItems.map(async item => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product: product!
      };
    }));
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if the product exists
    const product = await this.getProduct(insertCartItem.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if this item is already in the cart
    const existingCartItem = Array.from(this.cartItems.values()).find(
      item => item.userId === insertCartItem.userId && 
             item.productId === insertCartItem.productId &&
             item.color === insertCartItem.color &&
             item.size === insertCartItem.size
    );
    
    if (existingCartItem) {
      // Update quantity instead of adding a new item
      existingCartItem.quantity += insertCartItem.quantity;
      existingCartItem.updatedAt = new Date();
      this.cartItems.set(existingCartItem.id, existingCartItem);
      return existingCartItem;
    }
    
    // Add new cart item
    const id = this.currentId.cartItems++;
    const now = new Date();
    const cartItem: CartItem = {
      ...insertCartItem,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  
  async updateCartItem(id: number, userId: number, quantity: number): Promise<CartItem> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem || cartItem.userId !== userId) {
      throw new Error("Cart item not found");
    }
    
    cartItem.quantity = quantity;
    cartItem.updatedAt = new Date();
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  
  async removeFromCart(id: number, userId: number): Promise<void> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem || cartItem.userId !== userId) {
      throw new Error("Cart item not found");
    }
    
    this.cartItems.delete(id);
  }

  // Order methods
  async getOrders(userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    const orders = Array.from(this.orders.values())
      .filter(order => order.userId === userId);
    
    return this._populateOrdersWithItems(orders);
  }
  
  async getOrdersBySeller(sellerId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    const orders = Array.from(this.orders.values())
      .filter(order => order.sellerId === sellerId);
    
    return this._populateOrdersWithItems(orders);
  }
  
  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const orders = await this._populateOrdersWithItems([order]);
    return orders[0];
  }
  
  // Helper method to populate orders with their items
  async _populateOrdersWithItems(orders: Order[]): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    return Promise.all(orders.map(async order => {
      const orderItems = Array.from(this.orderItems.values())
        .filter(item => item.orderId === order.id);
      
      const itemsWithProducts = await Promise.all(orderItems.map(async item => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product: product!
        };
      }));
      
      return {
        ...order,
        items: itemsWithProducts
      };
    }));
  }
  
  async createOrder(
    insertOrder: InsertOrder, 
    items: { productId: number, quantity: number, price?: number, color?: string, size?: string }[]
  ): Promise<Order> {
    if (items.length === 0) {
      throw new Error("Order must have at least one item");
    }
    
    console.log("Creating order with data:", JSON.stringify(insertOrder, null, 2));
    console.log("Order items:", JSON.stringify(items, null, 2));
    
    // Create the order
    const id = this.currentId.orders++;
    const now = new Date();
    const order: Order = {
      ...insertOrder,
      id,
      status: "pending",
      paymentStatus: insertOrder.paymentStatus || "pending",
      recipientName: insertOrder.recipientName || "",
      recipientPhone: insertOrder.recipientPhone || "",
      notes: insertOrder.notes || "",
      shippingFee: insertOrder.shippingFee || 30000,
      trackingNumber: null,
      shippingMethod: insertOrder.shippingMethod || "Standard",
      estimatedDelivery: null,
      actualDelivery: null,
      isRated: false,
      returnRequested: false,
      returnReason: null,
      returnStatus: null,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(id, order);
    
    // Create order items
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      
      const orderItemId = this.currentId.orderItems++;
      const orderItem: OrderItem = {
        id: orderItemId,
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.discountPrice || product.price,
        color: item.color || null,
        size: item.size || null,
        isReviewed: false,
        rating: null,
        reviewText: null,
        reviewDate: null,
        createdAt: now,
        updatedAt: now
      };
      this.orderItems.set(orderItemId, orderItem);
      
      // Kiểm tra tồn kho
      if (product.stock < item.quantity) {
        throw new Error(`Không đủ hàng tồn kho cho sản phẩm ${product.name}. Chỉ còn ${product.stock} sản phẩm.`);
      }
      
      // Cập nhật số lượng đã bán và giảm tồn kho
      product.soldCount = (product.soldCount || 0) + item.quantity;
      product.stock = product.stock - item.quantity;
      this.products.set(product.id, product);
    }
    
    // Remove items from cart
    const cartItems = Array.from(this.cartItems.values())
      .filter(item => item.userId === insertOrder.userId);
    
    for (const cartItem of cartItems) {
      this.cartItems.delete(cartItem.id);
    }
    
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    order.status = status;
    order.updatedAt = new Date();
    this.orders.set(id, order);
    
    return order;
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    order.paymentStatus = status;
    order.updatedAt = new Date();
    this.orders.set(id, order);
    
    return order;
  }
  
  async updateTrackingInfo(id: number, data: { trackingNumber?: string, shippingMethod?: string, estimatedDelivery?: Date }): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    if (data.trackingNumber) {
      order.trackingNumber = data.trackingNumber;
    }
    
    if (data.shippingMethod) {
      order.shippingMethod = data.shippingMethod;
    }
    
    if (data.estimatedDelivery) {
      order.estimatedDelivery = data.estimatedDelivery;
    }
    
    order.updatedAt = new Date();
    this.orders.set(id, order);
    
    return order;
  }
  
  async markOrderDelivered(id: number): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    order.status = "delivered";
    order.actualDelivery = new Date();
    order.updatedAt = new Date();
    this.orders.set(id, order);
    
    return order;
  }
  
  async confirmOrderDelivery(id: number): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    if (order.status !== "delivered") {
      throw new Error("Order must be in 'delivered' status to confirm receipt");
    }
    
    order.status = "completed";
    order.completedAt = new Date();
    order.updatedAt = new Date();
    this.orders.set(id, order);
    
    return order;
  }
  
  async requestReturn(orderId: number, reason: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    
    if (order.status !== "delivered" && order.status !== "completed") {
      throw new Error("Order must be delivered or completed to request a return");
    }
    
    order.returnRequested = true;
    order.returnReason = reason;
    order.returnStatus = "pending";
    order.updatedAt = new Date();
    this.orders.set(orderId, order);
    
    return order;
  }
  
  async processReturn(orderId: number, status: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    
    if (!order.returnRequested) {
      throw new Error("No return request for this order");
    }
    
    order.returnStatus = status;
    
    if (status === "completed") {
      order.status = "returned";
      order.paymentStatus = "refunded";
    }
    
    order.updatedAt = new Date();
    this.orders.set(orderId, order);
    
    return order;
  }
  
  async addReview(orderItemId: number, data: { rating: number, reviewText: string }): Promise<OrderItem> {
    const orderItem = this.orderItems.get(orderItemId);
    if (!orderItem) {
      throw new Error("Order item not found");
    }
    
    const order = this.orders.get(orderItem.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    
    if (order.status !== "delivered" && order.status !== "completed") {
      throw new Error("Order must be delivered or completed to add a review");
    }
    
    // Update the order item with review data
    orderItem.isReviewed = true;
    orderItem.rating = data.rating;
    orderItem.reviewText = data.reviewText;
    orderItem.reviewDate = new Date();
    orderItem.updatedAt = new Date();
    this.orderItems.set(orderItemId, orderItem);
    
    // Update the product's rating and review count
    const product = await this.getProduct(orderItem.productId);
    if (product) {
      // Calculate new average rating
      const currentTotalRating = (product.rating || 0) * (product.reviewCount || 0);
      const newReviewCount = (product.reviewCount || 0) + 1;
      const newRating = (currentTotalRating + data.rating) / newReviewCount;
      
      product.rating = newRating;
      product.reviewCount = newReviewCount;
      product.updatedAt = new Date();
      this.products.set(product.id, product);
      
      // Also update seller's rating if this is their first review or changed
      const seller = await this.getSeller(product.sellerId);
      if (seller) {
        const sellerCurrentTotalRating = (seller.rating || 0) * (seller.reviewCount || 0);
        const sellerNewReviewCount = (seller.reviewCount || 0) + 1;
        const sellerNewRating = (sellerCurrentTotalRating + data.rating) / sellerNewReviewCount;
        
        seller.rating = sellerNewRating;
        seller.reviewCount = sellerNewReviewCount;
        seller.updatedAt = new Date();
        this.sellers.set(seller.id, seller);
      }
    }
    
    // Check if all items in the order have been reviewed
    const orderItems = Array.from(this.orderItems.values()).filter(item => item.orderId === order.id);
    const allItemsReviewed = orderItems.every(item => item.isReviewed);
    
    if (allItemsReviewed) {
      order.isRated = true;
      order.status = "completed";
      order.updatedAt = new Date();
      this.orders.set(order.id, order);
    }
    
    return orderItem;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Demo data initialization
  async initDemoData(): Promise<void> {
    // Only initialize if there are no users yet
    if (this.users.size > 0) {
      return;
    }

    // Mật khẩu đã được hash đúng cách với salt
    const hashedPassword = "b8be6cae5215c93784d722413544f398ddf937d013b750e21c5fd21b6a018ddfd3605e12ed12ebedf368e444eeffcf3b019d14d07b9908da06ef28cd5ba73687.3e267fe53de579fbb8b5feb762cc0d4a";
    
    // Create admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: hashedPassword, // "password123"
      email: "admin@fashionconnect.com",
      role: "admin",
      fullName: "Admin User",
      phone: "1234567890"
    });
    
    // Tạo user mua hàng
    const buyerUser = await this.createUser({
      username: "khachhang",
      password: hashedPassword, // "password123"
      email: "khachhang@example.com",
      role: "buyer",
      fullName: "Khách Hàng",
      phone: "0912345678"
    });
    
    // Tạo user bán hàng (Fashion Paradise)
    const sellerFashionParadise = await this.createUser({
      username: "fashionparadise",
      password: hashedPassword, // "password123"
      email: "fashionparadise@example.com",
      role: "seller",
      fullName: "Fashion Paradise",
      phone: "0987654321"
    });

    // Create demo shops
    // Tạo gian hàng mẫu với dữ liệu chi tiết
    const shopData = [
      {
        userId: sellerFashionParadise.id, // Link shop với tài khoản người bán đã tạo
        shopName: "Fashion Paradise",
        shopLogo: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-4.0.3",
        shopDescription: "Chuyên đầm, váy, áo kiểu nữ",
        mainCategory: "Thời trang nữ",
        address: "123 Fashion Street, Hanoi",
        phone: "0987654321",
        shopType: "small-business",
        shopBanner: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3",
        rating: 4.9,
        reviewCount: 156,
        productCount: 24,
        isVerified: true
      },
      {
        userId: 3,
        shopName: "Men's Style",
        shopLogo: "https://images.unsplash.com/photo-1495602787267-96ab76127c2a?ixlib=rb-4.0.3",
        shopDescription: "Thời trang nam cao cấp",
        mainCategory: "Thời trang nam",
        address: "456 Style Avenue, HCMC",
        phone: "0987654322",
        shopType: "brand",
        shopBanner: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?ixlib=rb-4.0.3",
        rating: 4.8,
        reviewCount: 124,
        productCount: 18,
        isVerified: true
      },
      {
        userId: 4,
        shopName: "Trend Accessories",
        shopLogo: "https://images.unsplash.com/photo-1537832816519-689ad163238b?ixlib=rb-4.0.3",
        shopDescription: "Phụ kiện thời trang cao cấp",
        mainCategory: "Phụ kiện",
        address: "789 Trend Blvd, Danang",
        phone: "0987654323",
        shopType: "individual",
        shopBanner: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?ixlib=rb-4.0.3",
        rating: 4.7,
        reviewCount: 98,
        productCount: 32,
        isVerified: true
      },
      {
        userId: 5,
        shopName: "Elegant Dresses",
        shopLogo: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-4.0.3",
        shopDescription: "Váy đầm sang trọng cho mọi dịp",
        mainCategory: "Váy đầm",
        address: "101 Elegant Street, HCMC",
        phone: "0987654324",
        shopType: "official",
        shopBanner: "https://images.unsplash.com/photo-1470092306007-055b6797ca72?ixlib=rb-4.0.3",
        rating: 4.9,
        reviewCount: 210,
        productCount: 45,
        isVerified: true
      },
      {
        userId: 6,
        shopName: "Shoe Haven",
        shopLogo: "https://images.unsplash.com/photo-1512675828443-4f454c42253a?ixlib=rb-4.0.3",
        shopDescription: "Giày dép thời trang cho mọi lứa tuổi",
        mainCategory: "Giày",
        address: "202 Footwear Avenue, Hanoi",
        phone: "0987654325",
        shopType: "brand",
        shopBanner: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?ixlib=rb-4.0.3",
        rating: 4.6,
        reviewCount: 178,
        productCount: 60,
        isVerified: true
      }
    ];

    for (const shopInfo of shopData) {
      await this.createSeller(shopInfo);
    }

    // Create demo categories
    const categories = [
      { name: "Áo thun", slug: "ao-thun", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?ixlib=rb-4.0.3" },
      { name: "Áo sơ mi", slug: "ao-so-mi", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3" },
      { name: "Quần jean", slug: "quan-jean", image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?ixlib=rb-4.0.3" },
      { name: "Váy đầm", slug: "vay-dam", image: "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?ixlib=rb-4.0.3" },
      { name: "Giày", slug: "giay", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3" },
      { name: "Phụ kiện", slug: "phu-kien", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3" }
    ];
    
    for (const cat of categories) {
      const id = this.currentId.categories++;
      const now = new Date();
      const category: Category = {
        ...cat,
        id,
        createdAt: now,
        updatedAt: now
      };
      this.categories.set(id, category);
    }
    
    // Import more demo products directly
    // Áo thun products
    const additionalProducts = [
      // Áo thun
      {
        name: "Áo thun basic nam cổ tròn",
        description: "Áo thun nam chất liệu cotton 100%, kiểu dáng basic, dễ phối đồ.",
        price: 189000,
        discountPrice: 129000,
        category: "Áo thun",
        subcategory: "Áo thun nam",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?ixlib=rb-4.0.3"],
        colors: ["Đen", "Trắng", "Xám", "Xanh navy"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        stock: 100,
        isFeatured: true,
        isFlashSale: true,
        flashSaleDiscount: 30
      },
      {
        name: "Áo thun nữ form rộng",
        description: "Áo thun nữ form rộng phong cách Hàn Quốc, chất vải mềm mại thoáng mát.",
        price: 159000,
        discountPrice: 99000,
        category: "Áo thun",
        subcategory: "Áo thun nữ",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1618354691438-25bc04584c23?ixlib=rb-4.0.3"],
        colors: ["Trắng", "Hồng", "Xanh mint", "Vàng nhạt"],
        sizes: ["S", "M", "L"],
        stock: 80,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 35
      },
      {
        name: "Áo thun nam in họa tiết",
        description: "Áo thun nam in họa tiết thời trang, chất liệu cotton cao cấp.",
        price: 220000,
        discountPrice: 165000,
        category: "Áo thun",
        subcategory: "Áo thun nam",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?ixlib=rb-4.0.3"],
        colors: ["Đen", "Trắng", "Xanh dương"],
        sizes: ["M", "L", "XL"],
        stock: 60,
        isFeatured: true,
        isFlashSale: false,
        flashSaleDiscount: null
      },
      {
        name: "Áo thun oversize unisex",
        description: "Áo thun oversize unisex form rộng thụng phong cách Hàn Quốc.",
        price: 199000,
        discountPrice: 149000,
        category: "Áo thun",
        subcategory: "Áo thun unisex",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3"],
        colors: ["Đen", "Trắng", "Xám"],
        sizes: ["M", "L", "XL"],
        stock: 75,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 25
      },
      
      // Áo sơ mi
      {
        name: "Áo sơ mi nam dài tay trắng công sở",
        description: "Áo sơ mi nam trắng chất liệu cotton cao cấp, kiểu dáng công sở.",
        price: 329000,
        discountPrice: 259000,
        category: "Áo sơ mi",
        subcategory: "Áo sơ mi nam",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-4.0.3"],
        colors: ["Trắng"],
        sizes: ["M", "L", "XL", "XXL"],
        stock: 80,
        isFeatured: true,
        isFlashSale: false,
        flashSaleDiscount: null
      },
      {
        name: "Áo sơ mi nữ công sở cơ bản",
        description: "Áo sơ mi nữ công sở form cơ bản, chất liệu mềm mại.",
        price: 289000,
        discountPrice: 229000,
        category: "Áo sơ mi",
        subcategory: "Áo sơ mi nữ",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1559807015-e5fe4e5484d9?ixlib=rb-4.0.3"],
        colors: ["Trắng", "Xanh nhạt", "Hồng nhạt"],
        sizes: ["S", "M", "L", "XL"],
        stock: 70,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      
      // Quần jean
      {
        name: "Quần jean nam skinny",
        description: "Quần jean nam skinny ôm dáng, màu xanh đậm, thích hợp mọi dáng người.",
        price: 459000,
        discountPrice: 359000,
        category: "Quần jean",
        subcategory: "Quần jean nam",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1582418702059-97ebafb35d09?ixlib=rb-4.0.3"],
        colors: ["Xanh đậm", "Xanh nhạt", "Đen"],
        sizes: ["29", "30", "31", "32", "33", "34"],
        stock: 70,
        isFeatured: true,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      {
        name: "Quần jean nữ ống rộng",
        description: "Quần jean nữ ống rộng dáng suông, phong cách Hàn Quốc.",
        price: 429000,
        discountPrice: 329000,
        category: "Quần jean",
        subcategory: "Quần jean nữ",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3"],
        colors: ["Xanh nhạt", "Xanh trung", "Trắng"],
        sizes: ["26", "27", "28", "29", "30"],
        stock: 60,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      
      // Váy đầm
      {
        name: "Đầm suông nữ công sở",
        description: "Đầm suông nữ thanh lịch, kiểu dáng đơn giản, phù hợp môi trường công sở.",
        price: 499000,
        discountPrice: 399000,
        category: "Váy đầm",
        subcategory: "Đầm công sở",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1596783074918-c84cb06531ca?ixlib=rb-4.0.3"],
        colors: ["Đen", "Xanh navy", "Đỏ đô"],
        sizes: ["S", "M", "L", "XL"],
        stock: 60,
        isFeatured: true,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      {
        name: "Váy hoa nữ mùa hè",
        description: "Váy hoa nữ thiết kế nhẹ nhàng, thoáng mát, phù hợp mùa hè.",
        price: 429000,
        discountPrice: 329000,
        category: "Váy đầm",
        subcategory: "Váy hoa",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?ixlib=rb-4.0.3"],
        colors: ["Họa tiết hoa"],
        sizes: ["S", "M", "L"],
        stock: 50,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      
      // Giày
      {
        name: "Giày thể thao nam",
        description: "Giày thể thao nam phong cách năng động, đế mềm êm chân.",
        price: 699000,
        discountPrice: 549000,
        category: "Giày",
        subcategory: "Giày thể thao nam",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3"],
        colors: ["Trắng", "Đen", "Xám"],
        sizes: ["39", "40", "41", "42", "43"],
        stock: 60,
        isFeatured: true,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      {
        name: "Giày thể thao nữ",
        description: "Giày thể thao nữ nhẹ, êm, thoáng khí, phù hợp đi chơi, tập thể dục.",
        price: 649000,
        discountPrice: 499000,
        category: "Giày",
        subcategory: "Giày thể thao nữ",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3"],
        colors: ["Trắng", "Hồng", "Xanh mint"],
        sizes: ["35", "36", "37", "38", "39"],
        stock: 55,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      
      // Phụ kiện
      {
        name: "Túi xách nữ thời trang",
        description: "Túi xách nữ thiết kế thời trang, sang trọng, chất liệu da cao cấp.",
        price: 799000,
        discountPrice: 649000,
        category: "Phụ kiện",
        subcategory: "Túi xách",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1597843797341-728c4b43c0b0?ixlib=rb-4.0.3"],
        colors: ["Đen", "Nâu", "Đỏ đô"],
        sizes: [],
        stock: 30,
        isFeatured: true,
        isFlashSale: true,
        flashSaleDiscount: 20
      },
      {
        name: "Ví nam da thật",
        description: "Ví nam chất liệu da thật cao cấp, thiết kế tinh tế, sang trọng.",
        price: 559000,
        discountPrice: 459000,
        category: "Phụ kiện",
        subcategory: "Ví",
        sellerId: 1,
        images: ["https://images.unsplash.com/photo-1606751296969-d7b0585d0c07?ixlib=rb-4.0.3"],
        colors: ["Đen", "Nâu"],
        sizes: [],
        stock: 40,
        isFeatured: false,
        isFlashSale: false,
        flashSaleDiscount: null
      }
    ];
    
    // Add more demo products
    for (const productData of additionalProducts) {
      const now = new Date();
      const id = this.currentId.products++;
      const product: Product = {
        ...productData,
        id,
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        createdAt: now,
        updatedAt: now
      };
      this.products.set(id, product);
    }
    
    console.log(`Added ${additionalProducts.length} additional demo products`);

    // Create demo seller
    const sellerUser = await this.createUser({
      username: "fashionshop",
      password: "$2b$10$X4kv7j5ZcG39WgogSl16sOGBvgfFzY1RfcJAhOvS9oMKDJgUdVhRm", // "password123"
      email: "seller@fashionconnect.com",
      role: "seller",
      fullName: "Fashion Shop",
      phone: "0987654321"
    });

    const seller = await this.createSeller({
      userId: sellerUser.id,
      shopName: "Fashion Paradise",
      shopType: "small-business",
      shopLogo: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-4.0.3",
      shopBanner: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3",
      shopDescription: "Chuyên đầm, váy, áo kiểu nữ",
      mainCategory: "Thời trang nữ",
      address: "123 Fashion Street, Hanoi",
      phone: "0987654321"
    });

    // Create demo products
    const products = [
      {
        name: "Đầm hoa nữ phong cách mùa hè",
        description: "Đầm hoa nữ chất liệu vải thoáng mát, thiết kế hiện đại phù hợp cho mùa hè.",
        price: 399000,
        discountPrice: 199000,
        category: "Váy đầm",
        subcategory: "Đầm hoa",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1583846783214-7229a91b20ed?ixlib=rb-4.0.3"],
        colors: ["Trắng", "Xanh nhạt", "Hồng pastel"],
        sizes: ["S", "M", "L", "XL"],
        stock: 50,
        isFeatured: true,
        isFlashSale: true,
        flashSaleDiscount: 50
      },
      {
        name: "Áo khoác jean unisex form rộng",
        description: "Áo khoác jean form rộng unisex phong cách Hàn Quốc, phù hợp cho cả nam và nữ.",
        price: 599000,
        discountPrice: 359000,
        category: "Áo khoác",
        subcategory: "Áo khoác jean",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?ixlib=rb-4.0.3"],
        colors: ["Xanh đậm", "Xanh nhạt", "Đen"],
        sizes: ["M", "L", "XL"],
        stock: 30,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 40
      },
      {
        name: "Áo thun nam cotton cổ tròn basic",
        description: "Áo thun nam chất liệu cotton 100%, thiết kế basic, dễ phối đồ.",
        price: 189000,
        discountPrice: 129000,
        category: "Áo thun",
        subcategory: "Áo thun basic",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3"],
        colors: ["Đen", "Trắng", "Xám", "Xanh navy"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        stock: 100,
        isFeatured: true,
        isFlashSale: true,
        flashSaleDiscount: 30
      },
      {
        name: "Quần kaki nam dáng regular fit",
        description: "Quần kaki nam dáng regular fit, chất liệu cao cấp, dễ phối đồ.",
        price: 399000,
        discountPrice: 299000,
        category: "Quần kaki",
        subcategory: "Quần kaki nam",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3"],
        colors: ["Kem", "Xanh rêu", "Nâu", "Đen"],
        sizes: ["29", "30", "31", "32", "33", "34"],
        stock: 45,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 25
      },
      {
        name: "Túi xách nữ đeo chéo thời trang",
        description: "Túi xách nữ đeo chéo thiết kế nhỏ gọn, sang trọng, phù hợp đi làm và dạo phố.",
        price: 450000,
        discountPrice: 179000,
        category: "Phụ kiện",
        subcategory: "Túi xách",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1597843797341-728c4b43c0b0?ixlib=rb-4.0.3"],
        colors: ["Đen", "Nâu", "Trắng kem"],
        sizes: [],
        stock: 25,
        isFeatured: false,
        isFlashSale: true,
        flashSaleDiscount: 60
      },
      {
        name: "Áo sơ mi nữ dài tay trơn màu",
        description: "Áo sơ mi nữ dài tay chất liệu lụa mềm mại, thoáng mát. Thiết kế đơn giản, thanh lịch.",
        price: 289000,
        discountPrice: null,
        category: "Áo sơ mi",
        subcategory: "Áo sơ mi nữ",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3"],
        colors: ["Trắng", "Xanh nhạt", "Hồng pastel", "Đen"],
        sizes: ["S", "M", "L", "XL"],
        stock: 60,
        isFeatured: true,
        isFlashSale: false,
        flashSaleDiscount: null
      },
      {
        name: "Váy liền thân hoa nhí tay ngắn",
        description: "Váy liền thân hoa nhí tay ngắn, chất liệu vải mềm mại, thiết kế nữ tính.",
        price: 349000,
        discountPrice: null,
        category: "Váy đầm",
        subcategory: "Váy liền thân",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?ixlib=rb-4.0.3"],
        colors: ["Họa tiết hoa nhí"],
        sizes: ["S", "M", "L"],
        stock: 40,
        isFeatured: true,
        isFlashSale: false,
        flashSaleDiscount: null
      },
      {
        name: "Áo khoác bomber unisex",
        description: "Áo khoác bomber unisex phong cách thể thao, năng động, phù hợp cho cả nam và nữ.",
        price: 499000,
        discountPrice: null,
        category: "Áo khoác",
        subcategory: "Áo khoác bomber",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1608234808654-2a8875faa7fd?ixlib=rb-4.0.3"],
        colors: ["Đen", "Xanh navy", "Xanh rêu"],
        sizes: ["M", "L", "XL"],
        stock: 35,
        isFeatured: true,
        isFlashSale: false,
        flashSaleDiscount: null
      },
      {
        name: "Quần short nam thể thao",
        description: "Quần short nam thể thao, chất liệu thun co giãn thoáng mát, phù hợp tập gym và dạo phố.",
        price: 199000,
        discountPrice: null,
        category: "Quần short",
        subcategory: "Quần short nam",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3"],
        colors: ["Đen", "Xám", "Xanh navy"],
        sizes: ["M", "L", "XL"],
        stock: 50,
        isFeatured: true,
        isFlashSale: false,
        flashSaleDiscount: null
      },
      {
        name: "Áo len nữ cổ lọ dáng rộng",
        description: "Áo len nữ cổ lọ dáng rộng, chất liệu len mềm mại, giữ ấm hiệu quả.",
        price: 299000,
        discountPrice: null,
        category: "Áo len",
        subcategory: "Áo len nữ",
        sellerId: seller.id,
        images: ["https://images.unsplash.com/photo-1578587018452-892bacefd3f2?ixlib=rb-4.0.3"],
        colors: ["Kem", "Nâu", "Đen", "Xám"],
        sizes: ["Freesize"],
        stock: 30,
        isFeatured: true,
        isFlashSale: false,
        flashSaleDiscount: null
      }
    ];

    for (const prod of products) {
      await this.createProduct(prod as InsertProduct);
    }

    // Create demo buyer
    await this.createUser({
      username: "buyer1",
      password: "$2b$10$X4kv7j5ZcG39WgogSl16sOGBvgfFzY1RfcJAhOvS9oMKDJgUdVhRm", // "password123"
      email: "buyer@fashionconnect.com",
      role: "buyer",
      fullName: "John Doe",
      phone: "0123456789"
    });
  }
}

// Lớp lưu trữ cơ sở dữ liệu
export class DatabaseStorage implements IStorage {
  // Giữ lại Map orders và sellers để tương thích với IStorage
  public orders: Map<number, Order>;
  public sellers: Map<number, Seller>; // Thêm Map sellers để tương thích với routes.ts
  public sessionStore: session.Store;

  constructor() {
    this.orders = new Map();
    this.sellers = new Map(); // Khởi tạo map sellers
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
    
    // Đồng bộ sellers map từ cơ sở dữ liệu
    this._syncSellersMap();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      avatar: insertUser.avatar || null
    }).returning();
    return user;
  }
  
  async updateUserRole(userId: number, role: string): Promise<void> {
    await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
  
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Product methods
  async getProducts(filters?: { category?: string, search?: string, flashSale?: boolean, featured?: boolean, showOutOfStock?: boolean }): Promise<Product[]> {
    let selectQuery = db.select().from(products);
    
    // Tạo một mảng các điều kiện
    const conditions: any[] = [];
    
    // Default: only show products in stock
    if (!filters?.showOutOfStock) {
      conditions.push(gt(products.stock, 0));
    }
    
    if (filters) {
      if (filters.category) {
        // Get category by slug
        const categoriesResult = await db.select()
          .from(categories)
          .where(eq(categories.slug, filters.category));
          
        if (categoriesResult.length > 0) {
          // Match by category name
          conditions.push(eq(products.category, categoriesResult[0].name));
        } else {
          // Try direct category match or subcategory match
          conditions.push(
            or(
              eq(products.category, filters.category),
              like(products.category, `%${filters.category}%`),
              like(products.subcategory, `%${filters.category}%`)
            )
          );
        }
      }
      
      if (filters.search) {
        conditions.push(
          or(
            like(products.name, `%${filters.search}%`),
            like(products.description, `%${filters.search}%`)
          )
        );
      }
      
      if (filters.flashSale) {
        conditions.push(eq(products.isFlashSale, true));
      }
      
      if (filters.featured) {
        conditions.push(eq(products.isFeatured, true));
      }
    }
    
    // Áp dụng tất cả các điều kiện
    if (conditions.length > 0) {
      for (const condition of conditions) {
        selectQuery = selectQuery.where(condition);
      }
    }
    
    // Lấy dữ liệu sau khi áp dụng các điều kiện
    const result = await selectQuery;
    
    // Xử lý các trường JSON cho mỗi sản phẩm
    return result.map(product => {
      return {
        ...product,
        // Chuyển đổi các trường từ chuỗi JSON thành mảng JavaScript
        images: typeof product.images === 'string' 
          ? JSON.parse(product.images) 
          : (product.images || []),
        colors: typeof product.colors === 'string' 
          ? JSON.parse(product.colors) 
          : (product.colors || []),
        sizes: typeof product.sizes === 'string' 
          ? JSON.parse(product.sizes) 
          : (product.sizes || [])
      };
    });
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    
    if (!product) return undefined;
    
    // Xử lý các trường JSON
    return {
      ...product,
      // Chuyển đổi các trường từ chuỗi JSON thành mảng JavaScript
      images: typeof product.images === 'string' 
        ? JSON.parse(product.images) 
        : (product.images || []),
      colors: typeof product.colors === 'string' 
        ? JSON.parse(product.colors) 
        : (product.colors || []),
      sizes: typeof product.sizes === 'string' 
        ? JSON.parse(product.sizes) 
        : (product.sizes || [])
    };
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // Đảm bảo các trường là mảng được chuyển đổi thành chuỗi JSON
    const dataToInsert = {
      ...insertProduct,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
    };
    
    // Chuyển đổi các trường mảng thành chuỗi JSON
    if (dataToInsert.images && Array.isArray(dataToInsert.images)) {
      dataToInsert.images = JSON.stringify(dataToInsert.images);
    }
    
    if (dataToInsert.colors && Array.isArray(dataToInsert.colors)) {
      dataToInsert.colors = JSON.stringify(dataToInsert.colors);
    }
    
    if (dataToInsert.sizes && Array.isArray(dataToInsert.sizes)) {
      dataToInsert.sizes = JSON.stringify(dataToInsert.sizes);
    }
    
    console.log("Đang lưu sản phẩm mới với dữ liệu:", {
      ...dataToInsert,
      images: dataToInsert.images ? `${typeof dataToInsert.images} với độ dài ${dataToInsert.images.length}` : 'Không có hình ảnh',
    });
    
    const [product] = await db.insert(products).values(dataToInsert).returning();
    
    // Update seller product count
    await db.update(sellers)
      .set({ 
        productCount: sql`${sellers.productCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(sellers.id, insertProduct.sellerId));
      
    return product;
  }
  
  async updateProduct(id: number, productUpdate: Partial<Product>): Promise<Product> {
    // Đảm bảo các trường là mảng được chuyển đổi thành chuỗi JSON
    const dataToUpdate = {
      ...productUpdate,
      updatedAt: new Date()
    };
    
    // Chuyển đổi các trường mảng thành chuỗi JSON
    if (dataToUpdate.images && Array.isArray(dataToUpdate.images)) {
      dataToUpdate.images = JSON.stringify(dataToUpdate.images);
    }
    
    if (dataToUpdate.colors && Array.isArray(dataToUpdate.colors)) {
      dataToUpdate.colors = JSON.stringify(dataToUpdate.colors);
    }
    
    if (dataToUpdate.sizes && Array.isArray(dataToUpdate.sizes)) {
      dataToUpdate.sizes = JSON.stringify(dataToUpdate.sizes);
    }
    
    console.log("Đang cập nhật sản phẩm với dữ liệu:", {
      ...dataToUpdate,
      images: dataToUpdate.images 
        ? `${typeof dataToUpdate.images} với độ dài ${dataToUpdate.images.length}` 
        : 'Không thay đổi hình ảnh',
    });
    
    const [product] = await db.update(products)
      .set(dataToUpdate)
      .where(eq(products.id, id))
      .returning();
      
    if (!product) {
      throw new Error("Product not found");
    }
    
    return product;
  }
  
  async deleteProduct(id: number): Promise<void> {
    const [product] = await db.select()
      .from(products)
      .where(eq(products.id, id));
      
    if (!product) {
      throw new Error("Product not found");
    }
    
    await db.delete(products)
      .where(eq(products.id, id));
      
    // Update seller product count
    await db.update(sellers)
      .set({ 
        productCount: sql`GREATEST(0, ${sellers.productCount} - 1)`,
        updatedAt: new Date()
      })
      .where(eq(sellers.id, product.sellerId));
  }
  
  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    const results = await db.select()
      .from(products)
      .where(eq(products.sellerId, sellerId));
      
    // Xử lý các trường JSON
    return results.map(product => {
      return {
        ...product,
        // Chuyển đổi các trường từ chuỗi JSON thành mảng JavaScript
        images: typeof product.images === 'string' 
          ? JSON.parse(product.images) 
          : (product.images || []),
        colors: typeof product.colors === 'string' 
          ? JSON.parse(product.colors) 
          : (product.colors || []),
        sizes: typeof product.sizes === 'string' 
          ? JSON.parse(product.sizes) 
          : (product.sizes || [])
      };
    });
  }

  // Seller methods
  async getSeller(id: number): Promise<Seller | undefined> {
    const [seller] = await db.select().from(sellers).where(eq(sellers.id, id));
    return seller;
  }
  
  async getSellerByUserId(userId: number): Promise<Seller | undefined> {
    const [seller] = await db.select()
      .from(sellers)
      .where(eq(sellers.userId, userId));
    return seller;
  }
  
  async createSeller(insertSeller: InsertSeller): Promise<Seller> {
    const [seller] = await db.insert(sellers).values({
      ...insertSeller,
      isVerified: false,
      rating: 0,
      reviewCount: 0,
      productCount: 0,
    }).returning();
    return seller;
  }
  
  async getSellers(): Promise<Seller[]> {
    const sellersList = await db.select().from(sellers);
    
    // Cập nhật Map sellers
    this._syncSellersFromList(sellersList);
    
    return sellersList;
  }
  
  // Phương thức riêng để đồng bộ hóa Map sellers từ cơ sở dữ liệu
  async _syncSellersMap(): Promise<void> {
    try {
      const sellersList = await db.select().from(sellers);
      this._syncSellersFromList(sellersList);
      console.log(`Đã đồng bộ ${sellersList.length} sellers từ cơ sở dữ liệu vào Map`);
    } catch (error) {
      console.error("Lỗi khi đồng bộ sellers map:", error);
    }
  }
  
  // Tiện ích để cập nhật Map sellers từ danh sách
  _syncSellersFromList(sellersList: Seller[]): void {
    // Xóa Map hiện tại và thêm lại từ danh sách
    this.sellers.clear();
    for (const seller of sellersList) {
      this.sellers.set(seller.id, seller);
    }
  }

  // Cart methods
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const items = await db.select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
      
    const result = [];
    
    for (const item of items) {
      const [product] = await db.select()
        .from(products)
        .where(eq(products.id, item.productId));
        
      if (product) {
        // Xử lý các trường JSON trong sản phẩm
        const processedProduct = {
          ...product,
          images: typeof product.images === 'string' 
            ? JSON.parse(product.images) 
            : (product.images || []),
          colors: typeof product.colors === 'string' 
            ? JSON.parse(product.colors) 
            : (product.colors || []),
          sizes: typeof product.sizes === 'string' 
            ? JSON.parse(product.sizes) 
            : (product.sizes || [])
        };
        
        result.push({
          ...item,
          product: processedProduct
        });
      }
    }
    
    return result;
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if product exists
    const [product] = await db.select()
      .from(products)
      .where(eq(products.id, insertCartItem.productId));
      
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if already in cart with same color/size
    const [existingItem] = await db.select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, insertCartItem.userId),
        eq(cartItems.productId, insertCartItem.productId),
        eq(cartItems.color || null, insertCartItem.color || null),
        eq(cartItems.size || null, insertCartItem.size || null)
      ));
      
    if (existingItem) {
      // Update quantity
      const [updated] = await db.update(cartItems)
        .set({ 
          quantity: existingItem.quantity + insertCartItem.quantity,
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
        
      return updated;
    }
    
    // Add new item
    const [cartItem] = await db.insert(cartItems)
      .values(insertCartItem)
      .returning();
      
    return cartItem;
  }
  
  async updateCartItem(id: number, userId: number, quantity: number): Promise<CartItem> {
    const [cartItem] = await db.update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(
        eq(cartItems.id, id),
        eq(cartItems.userId, userId)
      ))
      .returning();
      
    if (!cartItem) {
      throw new Error("Cart item not found");
    }
    
    return cartItem;
  }
  
  async removeFromCart(id: number, userId: number): Promise<void> {
    const result = await db.delete(cartItems)
      .where(and(
        eq(cartItems.id, id),
        eq(cartItems.userId, userId)
      ));
      
    if (!result) {
      throw new Error("Cart item not found");
    }
  }

  // Order methods
  async getOrders(userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    const results = await db.select()
      .from(orders)
      .where(eq(orders.userId, userId));
      
    return this._populateOrdersWithItems(results);
  }
  
  async getOrdersBySeller(sellerId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    const results = await db.select()
      .from(orders)
      .where(eq(orders.sellerId, sellerId));
      
    return this._populateOrdersWithItems(results);
  }
  
  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select()
      .from(orders)
      .where(eq(orders.id, id));
      
    if (!order) return undefined;
    
    const populatedOrders = await this._populateOrdersWithItems([order]);
    return populatedOrders[0];
  }
  
  // Helper method to populate orders with their items
  async _populateOrdersWithItems(orders: Order[]): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    const result = [];
    
    for (const order of orders) {
      const items = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
        
      const itemsWithProducts = [];
      
      for (const item of items) {
        const [product] = await db.select()
          .from(products)
          .where(eq(products.id, item.productId));
          
        if (product) {
          // Xử lý các trường JSON của sản phẩm
          const processedProduct = {
            ...product,
            images: typeof product.images === 'string' 
              ? JSON.parse(product.images) 
              : product.images,
            colors: typeof product.colors === 'string' 
              ? JSON.parse(product.colors) 
              : product.colors,
            sizes: typeof product.sizes === 'string' 
              ? JSON.parse(product.sizes) 
              : product.sizes
          };
          
          itemsWithProducts.push({
            ...item,
            product: processedProduct
          });
        }
      }
      
      result.push({
        ...order,
        items: itemsWithProducts
      });
    }
    
    return result;
  }
  
  async createOrder(
    insertOrder: InsertOrder, 
    items: { productId: number, quantity: number, price?: number, color?: string, size?: string }[]
  ): Promise<Order> {
    if (items.length === 0) {
      throw new Error("Order must have at least one item");
    }
    
    console.log("Creating order with insertOrder data:", JSON.stringify(insertOrder, null, 2));
    
    // Create order in transaction
    return await db.transaction(async (tx) => {
      // Create a clean object with only columns that exist in the database
      const orderValues = {
        user_id: insertOrder.userId,
        seller_id: insertOrder.sellerId,
        status: "pending",
        total_amount: insertOrder.totalAmount,
        deposit_amount: insertOrder.depositAmount || 0,
        shipping_address: insertOrder.shippingAddress,
        recipient_name: insertOrder.recipientName || "",
        recipient_phone: insertOrder.recipientPhone || "",
        notes: insertOrder.notes || "",
        payment_method: insertOrder.paymentMethod,
        payment_status: insertOrder.paymentStatus || "pending",
        shipping_fee: insertOrder.shippingFee || 30000,
        shipping_method: insertOrder.shippingMethod || "Standard",
        rental_start_date: insertOrder.rentalStartDate,
        rental_end_date: insertOrder.rentalEndDate, 
        rental_period_type: insertOrder.rentalPeriodType,
        rental_duration: insertOrder.rentalDuration
      };

      console.log("Order values for insertion:", JSON.stringify(orderValues, null, 2));
      
      // Insert order with explicitly named columns
      const [order] = await tx
        .insert(orders)
        .values(orderValues)
        .returning();
      
      // Insert order items and update product stock
      for (const item of items) {
        const [product] = await tx.select()
          .from(products)
          .where(eq(products.id, item.productId));
          
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        
        // Check stock
        if (product.stock < item.quantity) {
          throw new Error(`Không đủ hàng tồn kho cho sản phẩm: ${product.name}`);
        }
        
        // Create order item
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.discountPrice || product.rentalPricePerDay,
          depositAmount: product.depositAmount,
          rentalDuration: insertOrder.rentalDuration,
          rentalPeriodType: insertOrder.rentalPeriodType,
          rentalStartDate: insertOrder.rentalStartDate,
          rentalEndDate: insertOrder.rentalEndDate,
          color: item.color || null,
          size: item.size || null,
          isReviewed: false,
          rating: null,
          reviewText: null,
          reviewDate: null
        });
        
        // Update product stock and sold count
        await tx.update(products)
          .set({ 
            stock: product.stock - item.quantity,
            soldCount: (product.soldCount || 0) + item.quantity,
            updatedAt: new Date()
          })
          .where(eq(products.id, item.productId));
      }
      
      // Update order status to "pending" in case it wasn't set
      await tx.update(orders)
        .set({ status: "pending" })
        .where(eq(orders.id, order.id));
        
      // Add the order to the memory map for compatibility
      this.orders.set(order.id, order);
        
      return order;
    });
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const statusMap: { [key: string]: { [key: string]: Date | null } } = {
      "confirmed": { confirmedAt: new Date() },
      "processing": { processingAt: new Date() },
      "shipped": { shippedAt: new Date() },
      "delivered": { deliveredAt: new Date() },
      "completed": { completedAt: new Date() },
      "canceled": { canceledAt: new Date() }
    };
    
    const additionalFields = statusMap[status] || {};
    
    const [order] = await db.update(orders)
      .set({ 
        status,
        updatedAt: new Date(),
        ...additionalFields
      })
      .where(eq(orders.id, id))
      .returning();
      
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update in-memory map
    this.orders.set(order.id, order);
    
    return order;
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ 
        paymentStatus: status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
      
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update in-memory map
    this.orders.set(order.id, order);
    
    return order;
  }
  
  async updateTrackingInfo(id: number, data: { trackingNumber?: string, shippingMethod?: string, estimatedDelivery?: Date }): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
      
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update in-memory map
    this.orders.set(order.id, order);
    
    return order;
  }
  
  async markOrderDelivered(id: number): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ 
        status: "delivered",
        actualDelivery: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
      
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update in-memory map
    this.orders.set(order.id, order);
    
    return order;
  }
  
  async confirmOrderDelivery(id: number): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ 
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
      
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update in-memory map
    this.orders.set(order.id, order);
    
    return order;
  }
  
  async requestReturn(orderId: number, reason: string): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ 
        returnRequested: true,
        returnReason: reason,
        returnStatus: "pending",
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
      
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update in-memory map
    this.orders.set(order.id, order);
    
    return order;
  }
  
  async processReturn(orderId: number, status: string): Promise<Order> {
    const [order] = await db.update(orders)
      .set({ 
        returnStatus: status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
      
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update in-memory map
    this.orders.set(order.id, order);
    
    return order;
  }
  
  async addReview(orderItemId: number, data: { rating: number, reviewText: string }): Promise<OrderItem> {
    const [orderItem] = await db.update(orderItems)
      .set({ 
        isReviewed: true,
        rating: data.rating,
        reviewText: data.reviewText,
        reviewDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orderItems.id, orderItemId))
      .returning();
      
    if (!orderItem) {
      throw new Error("Order item not found");
    }
    
    // Update product rating
    const [product] = await db.select()
      .from(products)
      .where(eq(products.id, orderItem.productId));
      
    if (product) {
      const reviews = await db.select()
        .from(orderItems)
        .where(and(
          eq(orderItems.productId, product.id),
          isNotNull(orderItems.rating)
        ));
        
      const totalRating = reviews.reduce((sum, item) => sum + (item.rating || 0), 0);
      const newRating = reviews.length > 0 ? totalRating / reviews.length : 0;
      
      await db.update(products)
        .set({ 
          rating: newRating,
          reviewCount: reviews.length,
          updatedAt: new Date()
        })
        .where(eq(products.id, product.id));
    }
    
    // Update order rating status
    const [orderData] = await db.select()
      .from(orders)
      .where(eq(orders.id, orderItem.orderId));
      
    if (orderData) {
      // Check if all items are reviewed
      const orderItems = await db.select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderData.id));
        
      const allReviewed = orderItems.every(item => item.isReviewed);
      
      if (allReviewed) {
        await db.update(orders)
          .set({ 
            isRated: true,
            updatedAt: new Date()
          })
          .where(eq(orders.id, orderData.id));
      }
    }
    
    return orderItem;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  // Demo data
  async initDemoData(): Promise<void> {
    // Check if we already have data in core tables
    const existingUsers = await db.select().from(users);
    const existingProducts = await db.select().from(products);
    const existingSellers = await db.select().from(sellers);
    
    if (existingUsers.length > 0 && existingProducts.length > 0 && existingSellers.length > 0) {
      console.log('Demo data already exists, skipping initialization');
      return;
    }
    
    // Xóa dữ liệu cũ theo thứ tự đúng (tránh lỗi khóa ngoại)
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(cartItems);
    await db.delete(products);
    await db.delete(sellers);
    await db.delete(categories);
    await db.delete(users);
    
    console.log('Initializing demo data...');
    
    // Implement the same demo data as in MemStorage
    // 1. Add users
    const usersList = [
      { username: "admin", password: "$2b$10$X3EB9gO7ptzLbJY6HEXw4euoF0AEAx89bHgSCQl78kzMKMnMOtvVa", email: "admin@example.com", phone: "0123456789", fullName: "Admin User", role: "admin", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
      { username: "khachhang", password: "$2b$10$X3EB9gO7ptzLbJY6HEXw4euoF0AEAx89bHgSCQl78kzMKMnMOtvVa", email: "khachhang@example.com", phone: "0987654321", fullName: "Nguyễn Văn A", role: "buyer", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
      { username: "fashionparadise", password: "$2b$10$X3EB9gO7ptzLbJY6HEXw4euoF0AEAx89bHgSCQl78kzMKMnMOtvVa", email: "fashionparadise@example.com", phone: "0123456789", fullName: "Trần Thị B", role: "seller", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
      { username: "shoeshop", password: "$2b$10$X3EB9gO7ptzLbJY6HEXw4euoF0AEAx89bHgSCQl78kzMKMnMOtvVa", email: "shoeshop@example.com", phone: "0123456789", fullName: "Lê Văn C", role: "seller", avatar: "https://randomuser.me/api/portraits/men/3.jpg" },
    ];
    
    for (const userData of usersList) {
      await db.insert(users).values(userData);
    }
    
    // 2. Add categories
    const categoriesList = [
      { name: "Áo thun", slug: "ao-thun", image: "https://cf.shopee.vn/file/sg-11134201-22090-lw2pxm7hkxhv1b" },
      { name: "Áo sơ mi", slug: "ao-so-mi", image: "https://cf.shopee.vn/file/sg-11134201-22120-87zxn914wrlved" },
      { name: "Áo khoác", slug: "ao-khoac", image: "https://cf.shopee.vn/file/sg-11134201-22120-89iaiyx4erlv35" },
      { name: "Quần jean", slug: "quan-jean", image: "https://cf.shopee.vn/file/sg-11134201-22120-5y9v2r97wrlve1" },
      { name: "Quần tây", slug: "quan-tay", image: "https://cf.shopee.vn/file/vn-11134207-7qukw-lh2stlz08q8r94" },
      { name: "Váy đầm", slug: "vay-dam", image: "https://cf.shopee.vn/file/sg-11134201-23010-1g7i2llmdxlvc7" },
      { name: "Giày nam", slug: "giay-nam", image: "https://cf.shopee.vn/file/f070316ffc41dfa88c74f4caf63cbe43" },
      { name: "Giày nữ", slug: "giay-nu", image: "https://cf.shopee.vn/file/vn-11134207-7qukw-lfhlfh2clxo294" }
    ];
    
    for (const categoryData of categoriesList) {
      await db.insert(categories).values(categoryData);
    }
    
    // 3. Add sellers
    // Get seller users
    const sellerUsers = await db.select()
      .from(users)
      .where(eq(users.role, "seller"));
      
    const sellersData = [
      {
        userId: sellerUsers[0].id,
        shopName: "Fashion Paradise",
        shopType: "small-business",
        shopLogo: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-4.0.3",
        shopBanner: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3",
        shopDescription: "Chuyên đầm, váy, áo kiểu nữ",
        mainCategory: "Thời trang nữ",
        address: "123 Fashion Street, Hanoi",
        phone: "0987654321",
        rating: 5, // Chuyển từ 4.9 sang 5 vì schema yêu cầu số nguyên
        reviewCount: 156,
        productCount: 0,
        isVerified: true
      },
      {
        userId: sellerUsers[1].id,
        shopName: "Urban Shoes",
        shopType: "small-business",
        shopLogo: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?ixlib=rb-4.0.3",
        shopBanner: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3",
        shopDescription: "Chuyên các loại giày thể thao, giày nam nữ",
        mainCategory: "Giày dép",
        address: "456 Shoe Avenue, HCMC",
        phone: "0123456789",
        rating: 5, // Chuyển từ 4.7 sang 5 vì schema yêu cầu số nguyên
        reviewCount: 98,
        productCount: 0,
        isVerified: true
      }
    ];
    
    for (const sellerData of sellersData) {
      await db.insert(sellers).values(sellerData);
    }
    
    // 4. Add products
    // Get all sellers
    const allSellers = await db.select().from(sellers);
    
    // Add 10 products for each seller
    for (const seller of allSellers) {
      // Example products for Fashion Paradise (thời trang nữ)
      if (seller.shopName === "Fashion Paradise") {
        const fashionProducts = [
          {
            name: "Áo sơ mi nữ tay dài",
            description: "Áo sơ mi nữ tay dài, chất liệu lụa mềm, thoáng mát",
            // Thay đổi từ price thành rentalPricePerDay
            rentalPricePerDay: 25000,
            rentalPricePerWeek: 150000,
            rentalPricePerMonth: 450000,
            depositAmount: 200000,
            discountPrice: 19000,
            category: "Áo sơ mi",
            subcategory: "Áo sơ mi nữ",
            sellerId: seller.id,
            images: JSON.stringify([
              "https://cf.shopee.vn/file/sg-11134201-22100-bzi2jpm7tziv4b",
              "https://cf.shopee.vn/file/sg-11134201-22100-4x9aohm7tzive8"
            ]),
            colors: JSON.stringify(["Trắng", "Đen", "Hồng"]),
            sizes: JSON.stringify(["S", "M", "L", "XL"]),
            stock: 100,
            condition: "Mới",
            ageInMonths: 1,
            availableForRent: true,
            isFeatured: true,
            isFlashSale: true,
            flashSaleDiscount: 20
          },
          {
            name: "Váy đầm suông trơn",
            description: "Váy đầm suông trơn, kiểu dáng thanh lịch, trẻ trung",
            rentalPricePerDay: 35000,
            rentalPricePerWeek: 200000,
            rentalPricePerMonth: 600000,
            depositAmount: 300000,
            discountPrice: 30000,
            category: "Váy đầm",
            subcategory: "Váy đầm suông",
            sellerId: seller.id,
            images: JSON.stringify([
              "https://cf.shopee.vn/file/sg-11134201-23010-1g7i2llmdxlvc7",
              "https://cf.shopee.vn/file/sg-11134201-23010-yacwxmlmdxlva4"
            ]),
            colors: JSON.stringify(["Đen", "Xanh navy", "Đỏ"]),
            sizes: JSON.stringify(["S", "M", "L", "XL"]),
            stock: 80,
            condition: "Mới",
            ageInMonths: 2,
            availableForRent: true,
            isFeatured: true,
            isFlashSale: false,
            flashSaleDiscount: null
          },
          {
            name: "Áo thun nữ form rộng",
            description: "Áo thun nữ form rộng, chất liệu cotton 100%, in họa tiết",
            rentalPricePerDay: 15000,
            rentalPricePerWeek: 90000,
            rentalPricePerMonth: 260000,
            depositAmount: 150000,
            discountPrice: 13000,
            category: "Áo thun",
            subcategory: "Áo thun nữ",
            sellerId: seller.id,
            images: JSON.stringify([
              "https://cf.shopee.vn/file/sg-11134201-22090-lw2pxm7hkxhv1b",
              "https://cf.shopee.vn/file/sg-11134201-22090-v44kzm7hkxhvee"
            ]),
            colors: JSON.stringify(["Trắng", "Đen", "Hồng", "Xanh"]),
            sizes: JSON.stringify(["Free size"]),
            stock: 150,
            condition: "Tốt",
            ageInMonths: 3,
            availableForRent: true,
            isFeatured: false,
            isFlashSale: true,
            flashSaleDiscount: 15
          }
        ];
        
        // Add more products as needed
        for (const product of fashionProducts) {
          await db.insert(products).values(product);
        }
      }
      
      // Example products for Urban Shoes (giày dép)
      if (seller.shopName === "Urban Shoes") {
        const shoeProducts = [
          {
            name: "Giày thể thao nam",
            description: "Giày thể thao nam, đế cao su chống trơn trượt, thiết kế hiện đại",
            rentalPricePerDay: 45000,
            rentalPricePerWeek: 250000,
            rentalPricePerMonth: 700000,
            depositAmount: 400000,
            discountPrice: 40000,
            category: "Giày nam",
            subcategory: "Giày thể thao",
            sellerId: seller.id,
            images: JSON.stringify([
              "https://cf.shopee.vn/file/f070316ffc41dfa88c74f4caf63cbe43",
              "https://cf.shopee.vn/file/sg-11134201-22120-5ykf9poy0blvd3"
            ]),
            colors: JSON.stringify(["Đen", "Trắng", "Xám"]),
            sizes: JSON.stringify(["39", "40", "41", "42", "43"]),
            stock: 70,
            condition: "Mới",
            ageInMonths: 1,
            availableForRent: true,
            isFeatured: true,
            isFlashSale: false,
            flashSaleDiscount: null
          },
          {
            name: "Giày cao gót nữ",
            description: "Giày cao gót nữ, gót nhọn 7cm, kiểu dáng thanh lịch",
            rentalPricePerDay: 35000,
            rentalPricePerWeek: 200000,
            rentalPricePerMonth: 550000,
            depositAmount: 300000,
            discountPrice: 30000,
            category: "Giày nữ",
            subcategory: "Giày cao gót",
            sellerId: seller.id,
            images: JSON.stringify([
              "https://cf.shopee.vn/file/vn-11134207-7qukw-lh2stlz08q8r94",
              "https://cf.shopee.vn/file/vn-11134207-7qukw-lfhlfh2clxo294"
            ]),
            colors: JSON.stringify(["Đen", "Nude", "Trắng"]),
            sizes: JSON.stringify(["35", "36", "37", "38", "39"]),
            stock: 90,
            condition: "Mới",
            ageInMonths: 2,
            availableForRent: true,
            isFeatured: true,
            isFlashSale: true,
            flashSaleDiscount: 15
          },
          {
            name: "Giày lười nam công sở",
            description: "Giày lười nam công sở, chất liệu da bò, đế cao su êm ái",
            rentalPricePerDay: 55000,
            rentalPricePerWeek: 300000,
            rentalPricePerMonth: 850000,
            depositAmount: 500000,
            discountPrice: 50000,
            category: "Giày nam",
            subcategory: "Giày lười",
            sellerId: seller.id,
            images: JSON.stringify([
              "https://cf.shopee.vn/file/sg-11134201-23010-xwnrvtgwsxlvda",
              "https://cf.shopee.vn/file/sg-11134201-23010-rnifotfwsxlvcc"
            ]),
            colors: JSON.stringify(["Đen", "Nâu"]),
            sizes: JSON.stringify(["39", "40", "41", "42", "43"]),
            stock: 60,
            condition: "Mới",
            ageInMonths: 1,
            availableForRent: true,
            isFeatured: false,
            isFlashSale: false,
            flashSaleDiscount: null
          }
        ];
        
        // Add more products as needed
        for (const product of shoeProducts) {
          await db.insert(products).values(product);
        }
      }
    }
    
    // Update product counts for sellers
    for (const seller of allSellers) {
      const productCount = await db.select({ count: sql`COUNT(*)` })
        .from(products)
        .where(eq(products.sellerId, seller.id));
        
      await db.update(sellers)
        .set({ productCount: productCount[0].count })
        .where(eq(sellers.id, seller.id));
    }
    
    console.log('Demo data initialized successfully');
  }
}

// Sử dụng lớp lưu trữ cơ sở dữ liệu
export const storage = new DatabaseStorage();
