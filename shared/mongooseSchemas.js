import mongoose from 'mongoose';
const { Schema } = mongoose;

export const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

export const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  category: { type: String, required: true },
  imageUrl: { type: String },
  barcode: { type: String },
  sku: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const OrderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  items: [{ 
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    name: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const CustomerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  discount: { type: Number, required: true, min: 1, max: 100 },
  usageLimit: { type: Number, required: true, min: 1 },
  usageCount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const StoreSettingsSchema = new Schema({
  _id: { type: String, default: 'store-1' },
  storeName: { type: String, required: true },
  description: { type: String },
  address: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String }
});

// Create and export Mongoose models
export const User = mongoose.model('User', UserSchema);
export const Product = mongoose.model('Product', ProductSchema);
export const Order = mongoose.model('Order', OrderSchema);
export const Customer = mongoose.model('Customer', CustomerSchema);
export const Coupon = mongoose.model('Coupon', CouponSchema);
export const StoreSettings = mongoose.model('StoreSettings', StoreSettingsSchema);
