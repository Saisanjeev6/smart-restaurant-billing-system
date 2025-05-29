
'use client';

import type { MenuItem, NewMenuItem } from '@/types';
import { INITIAL_MENU_ITEMS } from './constants';

const MENU_ITEMS_KEY = 'restaurant_menu_items_v1';

const getStoredMenuItems = (): MenuItem[] => {
  if (typeof window === 'undefined') return [];
  const storedItems = localStorage.getItem(MENU_ITEMS_KEY);
  return storedItems ? JSON.parse(storedItems) : [];
};

export const initializeDefaultMenu = (): void => {
  if (typeof window === 'undefined') return;
  const items = getStoredMenuItems();
  if (items.length === 0) {
    localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(INITIAL_MENU_ITEMS));
  }
};

// Initialize menu on load
if (typeof window !== 'undefined') {
  initializeDefaultMenu();
}

export const getMenuItems = (): MenuItem[] => {
  if (typeof window === 'undefined') {
    // For server-side rendering or if localStorage is not available,
    // return initial constants to avoid breaking the app.
    // This should ideally be handled better in a full-stack app.
    return INITIAL_MENU_ITEMS;
  }
  // Ensure initialization if somehow missed (e.g., localStorage cleared manually)
  const items = getStoredMenuItems();
  if (items.length === 0 && INITIAL_MENU_ITEMS.length > 0) {
      localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
  }
  return items;
};

export const saveMenuItems = (items: MenuItem[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(items));
};

export const addMenuItem = (newItemData: NewMenuItem): { success: boolean; message: string; menuItems?: MenuItem[] } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };
  if (!newItemData.name.trim() || newItemData.price <= 0 || !newItemData.category.trim()) {
    return { success: false, message: 'Name, positive price, and category are required.' };
  }

  const items = getMenuItems();
  if (items.find(item => item.name.toLowerCase() === newItemData.name.toLowerCase())) {
    return { success: false, message: `Menu item "${newItemData.name}" already exists.` };
  }

  const newItem: MenuItem = {
    ...newItemData,
    id: `menu-${Date.now()}`,
  };

  items.push(newItem);
  saveMenuItems(items);
  return { success: true, message: `"${newItem.name}" added to menu.`, menuItems: items };
};
