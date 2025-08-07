import { type User, type InsertUser, type Product, type InsertProduct, type Customer, type InsertCustomer, type Order, type InsertOrder, type Coupon, type InsertCoupon, type StoreSettings, type InsertStoreSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct & { barcode: string }): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Order methods
  getAllOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order>;

  // Customer methods
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;

  // Coupon methods
  getAllCoupons(): Promise<Coupon[]>;
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon>;
  deleteCoupon(id: string): Promise<void>;

  // Store Settings methods
  getStoreSettings(): Promise<StoreSettings | undefined>;
  updateStoreSettings(settings: InsertStoreSettings): Promise<StoreSettings>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private customers: Map<string, Customer>;
  private coupons: Map<string, Coupon>;
  private storeSettings: StoreSettings | undefined;
  sessionStore: session.SessionStore;

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
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct & { barcode: string }): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...productData,
      id,
      createdAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) {
      throw new Error("Product not found");
    }
    const updated = { ...existing, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.products.has(id)) {
      throw new Error("Product not found");
    }
    this.products.delete(id);
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...orderData,
      id,
      createdAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) {
      throw new Error("Order not found");
    }
    const updated = { ...existing, ...updates };
    this.orders.set(id, updated);
    return updated;
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...customerData,
      id,
      createdAt: new Date()
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const existing = this.customers.get(id);
    if (!existing) {
      throw new Error("Customer not found");
    }
    const updated = { ...existing, ...updates };
    this.customers.set(id, updated);
    return updated;
  }

  // Coupon methods
  async getAllCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values());
  }

  async getCoupon(id: string): Promise<Coupon | undefined> {
    return this.coupons.get(id);
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    return Array.from(this.coupons.values()).find(
      (coupon) => coupon.code === code
    );
  }

  async createCoupon(couponData: InsertCoupon): Promise<Coupon> {
    const id = randomUUID();
    const coupon: Coupon = {
      ...couponData,
      id,
      usageCount: 0,
      createdAt: new Date()
    };
    this.coupons.set(id, coupon);
    return coupon;
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const existing = this.coupons.get(id);
    if (!existing) {
      throw new Error("Coupon not found");
    }
    const updated = { ...existing, ...updates };
    this.coupons.set(id, updated);
    return updated;
  }

  async deleteCoupon(id: string): Promise<void> {
    if (!this.coupons.has(id)) {
      throw new Error("Coupon not found");
    }
    this.coupons.delete(id);
  }

  // Store Settings methods
  async getStoreSettings(): Promise<StoreSettings | undefined> {
    return this.storeSettings;
  }

  async updateStoreSettings(settingsData: InsertStoreSettings): Promise<StoreSettings> {
    const id = this.storeSettings?.id || randomUUID();
    this.storeSettings = {
      ...settingsData,
      id
    };
    return this.storeSettings;
  }
}

export const storage = new MemStorage();
