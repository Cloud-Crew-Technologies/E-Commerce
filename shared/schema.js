// Client-side schemas and validation using Zod
import { z } from "zod";
export { User, Product, Order, Customer, Coupon, StoreSettings } from './mongooseSchemas.js';

// Zod schemas used in the client forms
// export const insertCouponSchema = z.object({
//   code: z.string().min(1, "Code is required"),
//   name: z.string().min(1, "Name is required"),
//   offerType: z.enum(["product", "discount"], { required_error: "Offer type is required" }),
//   discount: z.number({
//     invalid_type_error: "Discount must be a number",
//   })
//     .int("Discount must be an integer")
//     .min(0, "Min 0%")
//     .max(100, "Max 100%")
//     .optional(),
//   usageLimit: z.number({ invalid_type_error: "Usage limit must be a number" })
//     .int("Usage limit must be an integer")
//     .min(0, "Min 0")
//     .optional(),
//   buyProduct: z.string().optional(),
//   buyProductQuantity: z.number().int().min(0).optional(),
//   getProduct: z.string().optional(),
//   getProductQuantity: z.number().int().min(0).optional(),
//   expiryDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date({ required_error: "Expiry date is required" })),
//   isActive: z.boolean().default(true),
// }).superRefine((data, ctx) => {
//   if (data.offerType === "discount") {
//     if (data.discount === undefined || data.discount === null) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "Discount percentage is required for discount offers",
//         path: ["discount"],
//       });
//     }
//     if (data.usageLimit === undefined || data.usageLimit === null) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "Usage limit is required for discount offers",
//         path: ["usageLimit"],
//       });
//     }
//   } else if (data.offerType === "product") {
//     if (!data.buyProduct) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "Buy product is required for product offers",
//         path: ["buyProduct"],
//       });
//     }
//     if (data.buyProductQuantity === undefined || data.buyProductQuantity <= 0) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "Buy product quantity must be greater than 0",
//         path: ["buyProductQuantity"],
//       });
//     }
//     if (!data.getProduct) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "Get product is required for product offers",
//         path: ["getProduct"],
//       });
//     }
//     if (data.getProductQuantity === undefined || data.getProductQuantity <= 0) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "Get product quantity must be greater than 0",
//         path: ["getProductQuantity"],
//       });
//     }
//   }
// });

export const insertStoreSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  description: z.string().optional().nullable().default(""),
  contactEmail: z.string().email("Invalid email").optional().nullable().default(""),
  contactPhone: z.string().optional().nullable().default(""),
  address: z.string().optional().nullable().default(""),
  shipping: z.string().optional().nullable().default(""),
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