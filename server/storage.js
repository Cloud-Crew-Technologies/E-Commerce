import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.customers = new Map();
    this.coupons = new Map();
    this.storeSettings = undefined;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user) {
    const newUser = {
      id: randomUUID(),
      createdAt: new Date(),
      role: 'admin',
      ...user,
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // Product methods
  async getAllProducts() {
    return Array.from(this.products.values());
  }

  async getProduct(id) {
    return this.products.get(id);
  }

  async createProduct(product) {
    const newProduct = {
      id: randomUUID(),
      createdAt: new Date(),
      description: product.description || null,
      isActive: product.isActive !== undefined ? product.isActive : true,
      quantity: product.quantity || 0,
      imageUrl: product.imageUrl || null,
      barcode: randomUUID().replace(/-/g, '').substring(0, 12),
      ...product,
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async updateProduct(id, updates) {
    const product = this.products.get(id);
    if (!product) {
      throw new Error('Product not found');
    }
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id) {
    this.products.delete(id);
  }

  // Order methods
  async getAllOrders() {
    return Array.from(this.orders.values());
  }

  async getOrder(id) {
    return this.orders.get(id);
  }

  async createOrder(order) {
    const newOrder = {
      id: randomUUID(),
      createdAt: new Date(),
      status: order.status || 'pending',
      customerId: order.customerId || null,
      ...order,
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateOrder(id, updates) {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error('Order not found');
    }
    const updatedOrder = { ...order, ...updates };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Customer methods
  async getAllCustomers() {
    return Array.from(this.customers.values());
  }

  async getCustomer(id) {
    return this.customers.get(id);
  }

  async createCustomer(customer) {
    const newCustomer = {
      id: randomUUID(),
      createdAt: new Date(),
      phone: customer.phone || null,
      isActive: customer.isActive !== undefined ? customer.isActive : true,
      ...customer,
    };
    this.customers.set(newCustomer.id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id, updates) {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Coupon methods
  async getAllCoupons() {
    return Array.from(this.coupons.values());
  }

  async getCoupon(id) {
    return this.coupons.get(id);
  }

  async getCouponByCode(code) {
    return Array.from(this.coupons.values()).find(coupon => coupon.code === code);
  }

  async createCoupon(coupon) {
    const newCoupon = {
      id: randomUUID(),
      usageCount: 0,
      createdAt: new Date(),
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      ...coupon,
    };
    this.coupons.set(newCoupon.id, newCoupon);
    return newCoupon;
  }

  async updateCoupon(id, updates) {
    const coupon = this.coupons.get(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    const updatedCoupon = { ...coupon, ...updates };
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }

  async deleteCoupon(id) {
    this.coupons.delete(id);
  }

  // Store Settings methods
  async getStoreSettings() {
    return this.storeSettings || {
      id: 'store-1',
      storeName: '',
      description: null,
      address: null,
      contactEmail: null,
      contactPhone: null,
    };
  }

  async updateStoreSettings(settings) {
    const currentSettings = await this.getStoreSettings();
    this.storeSettings = {
      ...currentSettings,
      ...settings,
      address: settings.address || null,
      description: settings.description || null,
      contactEmail: settings.contactEmail || null,
      contactPhone: settings.contactPhone || null,
    };
    return this.storeSettings;
  }
}

export const storage = new MemStorage();