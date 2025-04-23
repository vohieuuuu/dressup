import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertSellerSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search, flashSale, featured, sellerId, showOutOfStock } = req.query;
      
      // If sellerId is specified, use getProductsBySeller
      if (sellerId) {
        const sellerProducts = await storage.getProductsBySeller(Number(sellerId));
        console.log(`Found ${sellerProducts.length} products for seller ID ${sellerId}`);
        return res.json(sellerProducts);
      }
      
      // Otherwise use regular getProducts with filters
      const products = await storage.getProducts({
        category: category as string,
        search: search as string,
        flashSale: flashSale === "true",
        featured: featured === "true",
        showOutOfStock: showOutOfStock === "true" || (req.isAuthenticated() && req.user.role === "seller")
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user.id,
      });
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Sellers
  app.get("/api/sellers", async (req, res) => {
    try {
      const sellers = await storage.getSellers();
      res.json(sellers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sellers" });
    }
  });

  app.get("/api/sellers/:id", async (req, res) => {
    try {
      const seller = await storage.getSeller(parseInt(req.params.id));
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
      res.json(seller);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller" });
    }
  });
  
  // Get seller by user ID
  app.get("/api/seller-by-user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const seller = await storage.getSellerByUserId(req.user.id);
      if (!seller) {
        return res.status(404).json({ message: "Seller not found for this user" });
      }
      res.json(seller);
    } catch (error) {
      console.error("Failed to fetch seller by user ID:", error);
      res.status(500).json({ message: "Failed to fetch seller" });
    }
  });

  app.get("/api/sellers/:id/products", async (req, res) => {
    try {
      const products = await storage.getProductsBySeller(parseInt(req.params.id));
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller products" });
    }
  });

  // Cart
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart data" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updatedItem = await storage.updateCartItem(
        parseInt(req.params.id),
        req.user.id,
        req.body.quantity
      );
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await storage.removeFromCart(parseInt(req.params.id), req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to remove from cart" });
    }
  });

  // Orders - Buyer Interface
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orders = await storage.getOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  // Get specific order
  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if the user is allowed to access this order
      if (order.userId !== req.user.id && 
          order.sellerId !== req.user.id && 
          req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  // Create a new order
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      console.log("Creating order with data:", JSON.stringify(req.body, null, 2));
      
      // Validate the order data
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      // Create the order
      const order = await storage.createOrder(validatedData, req.body.items);
      
      // Return the created order
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ 
        message: "Invalid order data", 
        error: (error as Error).message 
      });
    }
  });
  
  // Request a return
  app.post("/api/orders/:id/return", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Only the buyer can request a return
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedOrder = await storage.requestReturn(parseInt(req.params.id), req.body.reason);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to request return", error: (error as Error).message });
    }
  });
  
  // Submit a review for an order item
  app.post("/api/order-items/:id/review", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // First verify that the order item belongs to the user
      const orderItemId = parseInt(req.params.id);
      
      const orderItem = await storage.addReview(orderItemId, {
        rating: req.body.rating,
        reviewText: req.body.reviewText
      });
      
      res.json(orderItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to submit review", error: (error as Error).message });
    }
  });
  
  // Seller Interface - Get seller orders
  app.get("/api/seller/orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Get the seller associated with this user
      const seller = await storage.getSellerByUserId(req.user.id);
      
      if (!seller) {
        return res.status(404).json({ message: "Seller not found for this user" });
      }
      
      const orders = await storage.getOrdersBySeller(seller.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seller orders" });
    }
  });
  
  // Update order status (seller)
  app.patch("/api/seller/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get the seller associated with this user
      const seller = await storage.getSellerByUserId(req.user.id);
      
      if (!seller || order.sellerId !== seller.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, req.body.status);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order status" });
    }
  });
  
  // Update tracking information (seller)
  app.patch("/api/seller/orders/:id/tracking", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get the seller associated with this user
      const seller = await storage.getSellerByUserId(req.user.id);
      
      if (!seller || order.sellerId !== seller.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedOrder = await storage.updateTrackingInfo(orderId, {
        trackingNumber: req.body.trackingNumber,
        shippingMethod: req.body.shippingMethod,
        estimatedDelivery: req.body.estimatedDelivery ? new Date(req.body.estimatedDelivery) : undefined
      });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to update tracking information" });
    }
  });
  
  // Mark order as delivered (seller)
  app.patch("/api/seller/orders/:id/delivered", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get the seller associated with this user
      const seller = await storage.getSellerByUserId(req.user.id);
      
      if (!seller || order.sellerId !== seller.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedOrder = await storage.markOrderDelivered(orderId);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to mark order as delivered" });
    }
  });
  
  // Process return request (seller)
  app.patch("/api/seller/orders/:id/return", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get the seller associated with this user
      const seller = await storage.getSellerByUserId(req.user.id);
      
      if (!seller || order.sellerId !== seller.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!order.returnRequested) {
        return res.status(400).json({ message: "This order has no return request" });
      }
      
      const updatedOrder = await storage.processReturn(orderId, req.body.status);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to process return request" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const product = await storage.updateProduct(parseInt(req.params.id), req.body);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await storage.deleteProduct(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete product" });
    }
  });

  // Initialize demo data
  await storage.initDemoData();

  const httpServer = createServer(app);
  return httpServer;
}
