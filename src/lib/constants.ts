
import type { MenuItem } from '@/types';

// This MENU_ITEMS array will now serve as the INITIAL DEFAULT for the menuManager
// if localStorage is empty. Prices updated to reflect INR.
export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Crispy Spring Rolls', price: 250, category: 'Appetizer' },
  { id: '2', name: 'Classic Caesar Salad', price: 350, category: 'Appetizer' },
  { id: '3', name: 'Grilled Salmon Fillet', price: 750, category: 'Main Course' },
  { id: '4', name: 'Angus Steak Frites', price: 900, category: 'Main Course' },
  { id: '5', name: 'Creamy Pasta Carbonara', price: 450, category: 'Main Course' },
  { id: '6', name: 'New York Cheesecake', price: 300, category: 'Dessert' },
  { id: '7', name: 'Freshly Brewed Iced Tea', price: 120, category: 'Drink' },
  { id: '8', name: 'Artisan Latte', price: 180, category: 'Drink' },
  { id: '9', name: 'Margherita Pizza', price: 400, category: 'Main Course' },
  { id: '10', name: 'Mushroom Risotto', price: 550, category: 'Main Course' },
];

export const TABLE_NUMBERS: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

export const TAX_RATE = 0.08; // 8% sales tax (can be adjusted as needed)

