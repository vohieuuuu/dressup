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
  
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<void>;
  getUsers(): Promise<User[]>;
  
  // Product
  getProducts(filters?: { category?: string, search?: string, flashSale?: boolean, featured?: boolean }): Promise<Product[]>;
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
  createOrder(order: InsertOrder, items: { productId: number, quantity: number, color?: string, size?: string }[]): Promise<Order>;
  
  // Category
  getCategories(): Promise<Category[]>;
  
  // Demo data
  initDemoData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private sellers: Map<number, Seller>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private categories: Map<number, Category>;
  
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
    const seller: Seller = {
      ...insertSeller,
      id,
      isVerified: false,
      rating: 0,
      reviewCount: 0,
      productCount: 0,
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
    items: { productId: number, quantity: number, color?: string, size?: string }[]
  ): Promise<Order> {
    if (items.length === 0) {
      throw new Error("Order must have at least one item");
    }
    
    // Create the order
    const id = this.currentId.orders++;
    const now = new Date();
    const order: Order = {
      ...insertOrder,
      id,
      status: "pending",
      paymentStatus: "pending",
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
        color: item.color,
        size: item.size,
        createdAt: now
      };
      this.orderItems.set(orderItemId, orderItem);
      
      // Update product sold count
      product.soldCount = (product.soldCount || 0) + item.quantity;
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

    // Create admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "$2b$10$X4kv7j5ZcG39WgogSl16sOGBvgfFzY1RfcJAhOvS9oMKDJgUdVhRm", // "password123"
      email: "admin@fashionconnect.com",
      role: "admin",
      fullName: "Admin User",
      phone: "1234567890"
    });

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
