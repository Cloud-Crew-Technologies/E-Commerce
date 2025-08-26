// Client-side schemas and validation using Zod
import { z } from "zod";
export { User, Product, Order, Customer, Coupon, StoreSettings } from './mongooseSchemas.js';

// Zod schemas used in the client forms
export const insertCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  discount: z.number({ invalid_type_error: "Discount must be a number" })
    .int("Discount must be an integer")
    .min(1, "Min 1%")
    .max(100, "Max 100%"),
  usageLimit: z.number({ invalid_type_error: "Usage limit must be a number" })
    .int("Usage limit must be an integer")
    .min(1, "Min 1"),
  expiryDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date({ required_error: "Expiry date is required" })),
  isActive: z.boolean().default(true),
})

export const insertStoreSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  description: z.string().optional().nullable().default(""),
  contactEmail: z.string().email("Invalid email").optional().nullable().default(""),
  contactPhone: z.string().optional().nullable().default(""),
  address: z.string().optional().nullable().default(""),
})

// Validation functions for server-side use
export function validateUser(user) {
  if (!user.username || !user.password) {
    throw new Error('Username and password are required');
  }
  return user;
}

export function validateProduct(product) {
  if (!product.name || !product.price || !product.category || !product.sku) {
    throw new Error('Name, price, category, and SKU are required');
  }
  return product;
}

export function validateCustomer(customer) {
  if (!customer.name || !customer.email) {
    throw new Error('Name and email are required');
  }
  return customer;
}

export function validateOrder(order) {
  if (!order.customerName || !order.total || !order.items) {
    throw new Error('Customer name, total, and items are required');
  }
  return order;
}

export function validateCoupon(coupon) {
  if (!coupon.code || !coupon.name || coupon.discount === undefined || !coupon.usageLimit || !coupon.expiryDate) {
    throw new Error('Code, name, discount, usage limit, and expiry date are required');
  }
  return coupon;
}

export function validateStoreSettings(settings) {
  if (!settings.storeName) {
    throw new Error('Store name is required');
  }
  return settings;
}