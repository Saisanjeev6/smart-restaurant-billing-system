
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string; // e.g., Appetizer, Main Course, Drink
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'billed' | 'paid' | 'cancelled';

export interface Order {
  id: string;
  tableNumber?: number; // Optional for takeaway
  items: OrderItem[];
  status: OrderStatus;
  timestamp: string; // ISO date string
  type: 'dine-in' | 'takeaway';
  customerName?: string; // For takeaway
  customerPhone?: string; // For takeaway
  waiterId?: string; // ID of the waiter who placed/manages the order
  waiterUsername?: string; // Username of the waiter
}

export interface Bill {
  orderId: string;
  subtotal: number;
  taxRate: number; // e.g., 0.05 for 5%
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid'; // 'paid' explicitly means payment processed by admin
}

// Authentication related types
export type UserRole = 'admin' | 'waiter' | 'kitchen';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  password?: string; // Only used during creation/storage, NOT typically exposed
}

export interface NewUserCredentials {
  username: string;
  password?: string; // Password is required for creation
  role: 'waiter' | 'kitchen'; // Admin can create waiters or kitchen staff
}

