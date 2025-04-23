import { 
  User, InsertUser, 
  Product, InsertProduct, 
  Seller, InsertSeller, 
  CartItem, InsertCartItem, 
  Order, InsertOrder, 
  OrderItem, InsertOrderItem,
  Category, InsertCategory 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export const storage = new MemStorage();
