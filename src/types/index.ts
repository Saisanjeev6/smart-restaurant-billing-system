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
