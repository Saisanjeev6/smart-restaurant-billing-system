export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string; // e.g., Appetizer, Main Course, Drink
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber?: number; // Optional for takeaway
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'billed';
  timestamp: string; // ISO date string
  type: 'dine-in' | 'takeaway';
  customerName?: string; // For takeaway
  customerPhone?: string; // For takeaway
}

export interface Bill {
  orderId: string;
  subtotal: number;
  taxRate: number; // e.g., 0.05 for 5%
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
}

// Authentication related types
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'waiter';
  password?: string; // Only used during creation/storage, NOT typically exposed
}

export interface NewUserCredentials {
  username: string;
  password?: string; // Password is required for creation
  role: 'waiter'; // For now, only waiter creation is supported via UI
}
