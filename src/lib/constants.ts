import type { MenuItem } from '@/types';

export const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Crispy Spring Rolls', price: 8.50, category: 'Appetizer' },
  { id: '2', name: 'Classic Caesar Salad', price: 12.00, category: 'Appetizer' },
  { id: '3', name: 'Grilled Salmon Fillet', price: 25.00, category: 'Main Course' },
  { id: '4', name: 'Angus Steak Frites', price: 30.00, category: 'Main Course' },
  { id: '5', name: 'Creamy Pasta Carbonara', price: 18.00, category: 'Main Course' },
  { id: '6', name: 'New York Cheesecake', price: 9.00, category: 'Dessert' },
  { id: '7', name: 'Freshly Brewed Iced Tea', price: 3.50, category: 'Drink' },
  { id: '8', name: 'Artisan Latte', price: 4.50, category: 'Drink' },
  { id: '9', name: 'Margherita Pizza', price: 15.00, category: 'Main Course' },
  { id: '10', name: 'Mushroom Risotto', price: 20.00, category: 'Main Course' },
];

export const TABLE_NUMBERS: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

export const TAX_RATE = 0.08; // 8% sales tax
