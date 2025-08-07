import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { generateBarcode } from "./services/barcode.js";

export async function registerRoutes(app) {
  // Setup authentication routes
  setupAuth(app);

  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const orders = await storage.getAllOrders();
      const products = await storage.getAllProducts();
      const customers = await storage.getAllCustomers();
      
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const totalOrders = orders.length;
      const totalCustomers = customers.length;
      const lowStockCount = products.filter(p => p.quantity <= 10).length;
      
      res.json({
        totalRevenue,
        totalOrders,
        totalCustomers,
        lowStockCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const products = await storage.getAllProducts();
      const lowStockProducts = products.filter(p => p.quantity <= 10);
      res.json(lowStockProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Basic validation for required fields
      const { name, price, category, sku } = req.body;
      if (!name || !price || !category || !sku) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Generate barcode for the product
      const barcode = await generateBarcode(sku);
      
      const product = await storage.createProduct({
        ...req.body,
        barcode
      });
      
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.deleteProduct(req.params.id);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const orders = await storage.getAllOrders();
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      res.json(recentOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Basic validation for required fields
      const { customerName, total, items } = req.body;
      if (!customerName || !total || !items) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const order = await storage.createOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create order" });
    }
  });

  // Coupons routes
  app.get("/api/coupons", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const coupons = await storage.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post("/api/coupons", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Basic validation for required fields
      const { code, name, discount, usageLimit, expiryDate } = req.body;
      if (!code || !name || discount === undefined || !usageLimit || !expiryDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const coupon = await storage.createCoupon(req.body);
      res.status(201).json(coupon);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create coupon" });
    }
  });

  app.delete("/api/coupons/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.deleteCoupon(req.params.id);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  // Customers routes
  app.get("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Basic validation for required fields
      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Store Settings routes
  app.get("/api/store-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const settings = await storage.getStoreSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch store settings" });
    }
  });

  app.post("/api/store-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Basic validation for required fields
      const { storeName } = req.body;
      if (!storeName) {
        return res.status(400).json({ message: "Store name is required" });
      }
      
      const settings = await storage.updateStoreSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update store settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}