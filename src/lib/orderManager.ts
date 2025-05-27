
'use client';

import type { Order, OrderStatus } from '@/types';

const SHARED_ORDERS_KEY = 'restaurant_shared_orders_v1';

// Function to get all shared orders from localStorage
export const getSharedOrders = (): Order[] => {
  if (typeof window === 'undefined') {
    console.warn('localStorage not available on server, returning empty orders array.');
    return [];
  }
  try {
    const storedOrders = localStorage.getItem(SHARED_ORDERS_KEY);
    return storedOrders ? JSON.parse(storedOrders) : [];
  } catch (error) {
    console.error("Error parsing shared orders from localStorage:", error);
    return [];
  }
};

// Function to save all shared orders to localStorage
export const saveSharedOrders = (orders: Order[]): void => {
  if (typeof window === 'undefined') {
     console.warn('localStorage not available on server, orders not saved.');
    return;
  }
  try {
    localStorage.setItem(SHARED_ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Error saving shared orders to localStorage:", error);
  }
};

// Function to add a new order or update an existing one
export const addOrUpdateSharedOrder = (order: Order): void => {
  if (typeof window === 'undefined') return;
  let orders = getSharedOrders();
  const existingOrderIndex = orders.findIndex(o => o.id === order.id);
  if (existingOrderIndex > -1) {
    orders[existingOrderIndex] = order; // Update existing
  } else {
    orders.push(order); // Add new
  }
  saveSharedOrders(orders);
};

// Function to update the status of a specific order
export const updateSharedOrderStatus = (orderId: string, status: OrderStatus): boolean => {
  if (typeof window === 'undefined') return false;
  let orders = getSharedOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex > -1) {
    orders[orderIndex].status = status;
    orders[orderIndex].timestamp = new Date().toISOString(); // Update timestamp on status change
    saveSharedOrders(orders);
    return true;
  }
  return false;
};

// Function to initialize shared orders with mock data if empty
// Typically called on Admin page or a similar central place for initial setup
export const initializeSharedOrdersWithMockData = (mockOrders: Order[]) => {
  if (typeof window === 'undefined') return;
  const orders = getSharedOrders();
  if (orders.length === 0 && mockOrders.length > 0) {
    // Filter mock orders to only include those that might realistically be active
    const activeMockOrders = mockOrders.filter(o => o.status !== 'billed' || (new Date().getTime() - new Date(o.timestamp).getTime()) < (24 * 60 * 60 * 1000 * 2) ); // Keep billed from last 2 days for example
    saveSharedOrders(activeMockOrders);
  }
};

// Function to get a specific order by ID
export const getSharedOrderById = (orderId: string): Order | undefined => {
  if (typeof window === 'undefined') return undefined;
  const orders = getSharedOrders();
  return orders.find(o => o.id === orderId);
};
