import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertSellerSchema, sellers, orders } from "@shared/schema";
import { pool } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search, flashSale, featured, sellerId, showOutOfStock } = req.query;
      
      // If sellerId is specified, use getProductsBySeller
      let products;
      if (sellerId) {
        products = await storage.getProductsBySeller(Number(sellerId));
        console.log(`Found ${products.length} products for seller ID ${sellerId}`);
      } else {
        // Otherwise use regular getProducts with filters
        products = await storage.getProducts({
          category: category as string,
          search: search as string,
          flashSale: flashSale === "true",
          featured: featured === "true",
          showOutOfStock: showOutOfStock === "true" || (req.isAuthenticated() && req.user.role === "seller")
        });
      }
      
      // Parse JSON fields
      const processedProducts = products.map(product => ({
        ...product,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
        colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
        sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
      }));
      
      res.json(processedProducts);
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
      
      // Parse JSON fields
      const processedProduct = {
        ...product,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
        colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
        sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
      };
      
      res.json(processedProduct);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Nếu images được gửi lên dưới dạng mảng các base64, chúng ta giữ nguyên
      // Nếu images được gửi lên dưới dạng mảng URL, chúng ta vẫn giữ nguyên 
      // (trong trường hợp người dùng muốn nhập link trực tiếp)
      
      console.log("Nhận dữ liệu sản phẩm:", {
        ...req.body,
        images: req.body.images ? `Nhận ${req.body.images.length} hình ảnh` : 'Không có hình ảnh',
      });
      
      // Lưu ý: images nên đã là một mảng, được chuyển đổi thành JSON string để lưu vào DB
      const productData = {
        ...req.body,
        sellerId: req.user.id,
      };

      const validatedData = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedData);
      
      // Parse JSON fields for the response
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
      
      res.status(201).json(processedProduct);
    } catch (error) {
      console.error("Lỗi khi tạo sản phẩm:", error);
      res.status(400).json({ message: "Invalid product data", error: (error as Error).message });
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
      
      // Parse JSON fields
      const processedProducts = products.map(product => ({
        ...product,
        images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
        colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
        sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes
      }));
      
      res.json(processedProducts);
    } catch (error) {
      console.error("Error fetching seller products:", error);
      res.status(500).json({ message: "Failed to fetch seller products" });
    }
  });
  
  // API endpoint cho người bán cập nhật sản phẩm của họ
  app.put("/api/seller/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Kiểm tra xem sản phẩm có thuộc về người bán này không
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Lấy tất cả các seller thuộc về user này
      const userSellers = Array.from(storage.sellers.values())
        .filter(s => s.userId === req.user.id);
      
      // Lấy tất cả ID của các shop thuộc về user này
      const userSellerIds = userSellers.map(s => s.id);
      
      // Kiểm tra xem sản phẩm có thuộc về các shop của user này không
      if (!userSellerIds.includes(product.sellerId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log("Cập nhật sản phẩm:", {
        ...req.body,
        images: req.body.images ? `Nhận ${req.body.images.length} hình ảnh` : 'Không có hình ảnh',
      });

      // Hình ảnh sẽ ở dạng mảng và được chuyển đổi thành JSON string trong storage
      const updatedProduct = await storage.updateProduct(parseInt(req.params.id), req.body);
      
      // Parse JSON fields for the response
      const processedProduct = {
        ...updatedProduct,
        images: typeof updatedProduct.images === 'string' 
          ? JSON.parse(updatedProduct.images) 
          : updatedProduct.images,
        colors: typeof updatedProduct.colors === 'string' 
          ? JSON.parse(updatedProduct.colors) 
          : updatedProduct.colors,
        sizes: typeof updatedProduct.sizes === 'string' 
          ? JSON.parse(updatedProduct.sizes) 
          : updatedProduct.sizes
      };
      
      res.json(processedProduct);
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      res.status(400).json({ 
        message: "Failed to update product", 
        error: (error as Error).message 
      });
    }
  });

  // Cart
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const cartItems = await storage.getCartItems(req.user.id);
      
      // Parse product JSON fields in each cart item
      const processedItems = cartItems.map(item => ({
        ...item,
        product: {
          ...item.product,
          images: typeof item.product.images === 'string' 
            ? JSON.parse(item.product.images) 
            : item.product.images,
          colors: typeof item.product.colors === 'string' 
            ? JSON.parse(item.product.colors) 
            : item.product.colors,
          sizes: typeof item.product.sizes === 'string' 
            ? JSON.parse(item.product.sizes) 
            : item.product.sizes
        }
      }));
      
      res.json(processedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      console.log("Cart item data:", req.body); // Log the cart data to debug
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Cart validation error:", error); // Log the detailed error
      res.status(400).json({ message: "Invalid cart data", error: error.toString() });
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
      
      // Process JSON fields in products in order items
      const processedOrders = orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            images: typeof item.product.images === 'string' 
              ? JSON.parse(item.product.images) 
              : item.product.images,
            colors: typeof item.product.colors === 'string' 
              ? JSON.parse(item.product.colors) 
              : item.product.colors,
            sizes: typeof item.product.sizes === 'string' 
              ? JSON.parse(item.product.sizes) 
              : item.product.sizes
          }
        }))
      }));
      
      res.json(processedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
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
      if (req.user.role === "admin") {
        // Admin can access all orders
      } else if (order.userId === req.user.id) {
        // User can access their own orders
      } else if (req.user.role === "seller") {
        // Lấy tất cả các seller thuộc về user này
        const userSellers = Array.from(storage.sellers.values())
          .filter(s => s.userId === req.user.id);
        
        // Lấy tất cả ID của các shop thuộc về user này
        const userSellerIds = userSellers.map(s => s.id);
        
        // Kiểm tra xem đơn hàng có thuộc về các shop của user này không
        if (!userSellerIds.includes(order.sellerId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Lấy thông tin người bán từ sellerId
      const seller = await storage.getSeller(order.sellerId);
      
      // Process JSON fields in products in order items
      const processedOrder = {
        ...order,
        seller: seller, // Thêm thông tin người bán
        items: order.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            images: typeof item.product.images === 'string' 
              ? JSON.parse(item.product.images) 
              : item.product.images,
            colors: typeof item.product.colors === 'string' 
              ? JSON.parse(item.product.colors) 
              : item.product.colors,
            sizes: typeof item.product.sizes === 'string' 
              ? JSON.parse(item.product.sizes) 
              : item.product.sizes
          }
        }))
      };
      
      res.json(processedOrder);
    } catch (error) {
      console.error("Error fetching order details:", error);
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
      
      // Lấy user_id từ session
      const userId = req.user.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      console.log("User ID from session:", userId);
      console.log("User object from session:", JSON.stringify(req.user, null, 2));
      
      // Thêm userId vào dữ liệu đơn hàng
      const orderData = {
        ...req.body,
        userId: userId
      };
      
      // Validate dữ liệu đơn hàng
      const validatedData = insertOrderSchema.parse(orderData);
      console.log("Validated order data:", JSON.stringify(validatedData, null, 2));
      
      // ===== Lưu trực tiếp vào database để debug ===== 
      try {
        // Tạo đơn hàng trong database với transaction thông qua phương thức storage
        const order = await storage.createOrder(validatedData, req.body.items);
        
        // Trả về đơn hàng đã được tạo
        res.status(201).json(order);
      } catch (dbError) {
        console.error("Database error creating order:", dbError);
        
        // Log thêm thông tin để debug
        if (dbError instanceof Error) {
          console.error("Error message:", dbError.message);
          console.error("Error stack:", dbError.stack);
        }
        
        res.status(500).json({ 
          message: "Failed to create order in database", 
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }
    } catch (error) {
      console.error("Order validation error:", error);
      res.status(400).json({ 
        message: "Invalid order data", 
        error: (error as Error).message 
      });
    }
  });
  
  // Confirm order delivery (buyer confirms receipt)
  app.post("/api/orders/:id/confirm-delivery", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Only the buyer can confirm delivery
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedOrder = await storage.confirmOrderDelivery(parseInt(req.params.id));
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ 
        message: "Failed to confirm delivery", 
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
      // Lấy tất cả các seller thuộc về user này từ database
      const sellersQuery = await pool.query(
        `SELECT * FROM sellers WHERE user_id = $1`,
        [req.user.id]
      );
      
      const userSellers = sellersQuery.rows;
      
      if (userSellers.length === 0) {
        return res.status(404).json({ message: "Seller not found for this user" });
      }
      
      // Log thông tin cho debug
      console.log("User ID:", req.user.id);
      console.log("User Sellers:", userSellers.map(s => ({ id: s.id, name: s.shop_name })));
      
      // Lấy tất cả ID của các shop thuộc về user này
      const sellerIds = userSellers.map(s => s.id);
      console.log("Seller IDs:", sellerIds);
      
      // Lấy các đơn hàng từ cơ sở dữ liệu
      // Truy vấn tất cả đơn hàng từ sellers của user
      // Sử dụng SQL thô để có thể dùng IN
      const orderQueryResult = await pool.query(
        `SELECT * FROM orders WHERE seller_id = ANY($1)`,
        [sellerIds]
      );
      
      console.log("DB order query result count:", orderQueryResult.rows.length);
      
      if (orderQueryResult.rows.length === 0) {
        return res.json([]);
      }
      
      // Lấy ID của tất cả đơn hàng
      const orderIds = orderQueryResult.rows.map(order => order.id);
      
      // Lấy các order_items cho các đơn hàng
      const orderItemsQuery = await pool.query(
        `SELECT oi.*, p.* 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ANY($1)`,
        [orderIds]
      );
      
      console.log("Order items count:", orderItemsQuery.rows.length);
      
      // Gán các items vào từng đơn hàng
      const ordersWithItems = orderQueryResult.rows.map(order => {
        const items = orderItemsQuery.rows
          .filter(item => item.order_id === order.id)
          .map(item => {
            // Tách thông tin sản phẩm và order item
            const product = {
              id: item.id,
              name: item.name,
              description: item.description,
              category: item.category,
              seller_id: item.seller_id,
              images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images,
              colors: typeof item.colors === 'string' ? JSON.parse(item.colors) : item.colors,
              sizes: typeof item.sizes === 'string' ? JSON.parse(item.sizes) : item.sizes,
              stock: item.stock,
              // Thêm các trường khác của sản phẩm nếu cần
            };
            
            return {
              id: item.id,
              order_id: item.order_id,
              product_id: item.product_id,
              quantity: item.quantity,
              color: item.color,
              size: item.size,
              rental_start_date: item.rental_start_date,
              rental_end_date: item.rental_end_date,
              // Thêm các trường khác của order item nếu cần
              product: product
            };
          });
          
        return {
          ...order,
          items: items
        };
      });
      
      // Chuyển đổi snake_case sang camelCase cho client
      const processedOrders = ordersWithItems.map(order => {
        return {
          id: order.id,
          userId: order.user_id,
          sellerId: order.seller_id,
          status: order.status,
          totalAmount: order.total_amount,
          depositAmount: order.deposit_amount,
          shippingFee: order.shipping_fee,
          shippingAddress: order.shipping_address,
          recipientName: order.recipient_name,
          recipientPhone: order.recipient_phone,
          notes: order.notes,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          trackingNumber: order.tracking_number,
          shippingMethod: order.shipping_method,
          rentalStartDate: order.rental_start_date,
          rentalEndDate: order.rental_end_date,
          rentalDuration: order.rental_duration,
          rentalPeriodType: order.rental_period_type,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          items: order.items.map(item => ({
            id: item.id,
            orderId: item.order_id,
            productId: item.product_id,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
            rentalStartDate: item.rental_start_date,
            rentalEndDate: item.rental_end_date,
            product: {
              ...item.product,
              sellerId: item.product.seller_id
            }
          }))
        };
      });
      
      res.json(processedOrders);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
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
      
      // Lấy đơn hàng từ database
      const orderResult = await pool.query(
        `SELECT * FROM orders WHERE id = $1`,
        [orderId]
      );
      
      if (!orderResult.rows.length) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const order = orderResult.rows[0];
      console.log(`API: Trạng thái hiện tại của đơn hàng #${orderId}: ${order.status}`);
      console.log(`API: Đang cập nhật sang trạng thái: ${req.body.status}`);
      
      // Lấy tất cả các seller thuộc về user này từ database
      const sellersResult = await pool.query(
        `SELECT * FROM sellers WHERE user_id = $1`,
        [req.user.id]
      );
      
      const userSellerIds = sellersResult.rows.map(s => s.id);
      console.log(`API: User ID ${req.user.id} có các seller ID: ${userSellerIds.join(', ')}`);
      
      // Kiểm tra xem đơn hàng có thuộc về các shop của user này không
      if (!userSellerIds.includes(order.seller_id)) {
        console.log(`API: Access denied - Order seller ID ${order.seller_id} không thuộc về user này`);
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Chuẩn bị dữ liệu cập nhật
      const status = req.body.status;
      const updateFields = [
        `status = $1`,
        `updated_at = NOW()`
      ];
      
      // Thêm timestamp phù hợp với trạng thái mới
      if (status === "confirmed" && order.status === "pending") {
        updateFields.push(`confirmed_at = NOW()`);
      } else if (status === "processing" && ["pending", "confirmed"].includes(order.status)) {
        updateFields.push(`processing_at = NOW()`);
      } else if (status === "shipped" && ["pending", "confirmed", "processing"].includes(order.status)) {
        updateFields.push(`shipped_at = NOW()`);
      } else if (status === "delivered" && ["pending", "confirmed", "processing", "shipped"].includes(order.status)) {
        updateFields.push(`actual_delivery = NOW()`);
      } else if (status === "completed") {
        updateFields.push(`completed_at = NOW()`);
      } else if (status === "canceled") {
        updateFields.push(`canceled_at = NOW()`);
      }
      
      // Tạo và thực thi câu lệnh SQL
      const updateQuery = `
        UPDATE orders 
        SET ${updateFields.join(', ')} 
        WHERE id = $2
        RETURNING *
      `;
      
      const updateValues = [status, orderId];
      
      console.log(`API: Thực thi SQL: ${updateQuery}`);
      console.log(`API: Với các giá trị: ${updateValues.join(', ')}`);
      
      try {
        const updateResult = await pool.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          console.log(`API: Không tìm thấy đơn hàng sau khi cập nhật`);
          return res.status(404).json({ message: "Order not found after update" });
        }
        
        const updatedOrder = updateResult.rows[0];
        console.log(`API: Cập nhật thành công. Trạng thái mới: ${updatedOrder.status}`);
        
        return res.json(updatedOrder);
      } catch (sqlError) {
        console.error("Direct SQL update error:", sqlError);
        // Không sử dụng fallback nữa để tránh lỗi response đã được gửi
        return res.status(500).json({ 
          message: "Database error while updating order status",
          error: sqlError.message 
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
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
      
      // Lấy tất cả các seller thuộc về user này
      const userSellers = Array.from(storage.sellers.values())
        .filter(s => s.userId === req.user.id);
      
      // Lấy tất cả ID của các shop thuộc về user này
      const userSellerIds = userSellers.map(s => s.id);
      
      // Kiểm tra xem đơn hàng có thuộc về các shop của user này không
      if (!userSellerIds.includes(order.sellerId)) {
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
      
      // Lấy tất cả các seller thuộc về user này
      const userSellers = Array.from(storage.sellers.values())
        .filter(s => s.userId === req.user.id);
      
      // Lấy tất cả ID của các shop thuộc về user này
      const userSellerIds = userSellers.map(s => s.id);
      
      // Kiểm tra xem đơn hàng có thuộc về các shop của user này không
      if (!userSellerIds.includes(order.sellerId)) {
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
      
      // Lấy tất cả các seller thuộc về user này
      const userSellers = Array.from(storage.sellers.values())
        .filter(s => s.userId === req.user.id);
      
      // Lấy tất cả ID của các shop thuộc về user này
      const userSellerIds = userSellers.map(s => s.id);
      
      // Kiểm tra xem đơn hàng có thuộc về các shop của user này không
      if (!userSellerIds.includes(order.sellerId)) {
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
