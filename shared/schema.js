// Simple schema definitions for JavaScript
export const userSchema = {
  id: '',
  username: '',
  password: '',
  role: 'admin',
  createdAt: null
};

export const productSchema = {
  id: '',
  name: '',
  description: null,
  price: '',
  quantity: 0,
  category: '',
  imageUrl: null,
  barcode: null,
  sku: '',
  isActive: true,
  createdAt: null
};

export const orderSchema = {
  id: '',
  customerId: null,
  customerName: '',
  total: '',
  status: 'pending',
  items: '', // JSON string
  createdAt: null
};

export const customerSchema = {
  id: '',
  name: '',
  email: '',
  phone: null,
  isActive: true,
  createdAt: null
};

export const couponSchema = {
  id: '',
  code: '',
  name: '',
  discount: 0,
  usageLimit: 0,
  usageCount: 0,
  expiryDate: null,
  isActive: true,
  createdAt: null
};

export const storeSettingsSchema = {
  id: 'store-1',
  storeName: '',
  description: null,
  address: null,
  contactEmail: null,
  contactPhone: null
};