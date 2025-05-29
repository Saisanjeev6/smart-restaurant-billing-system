
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
    return INITIAL_MENU_ITEMS;
  }
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
    id: `menu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Added randomness to ID
  };

  items.push(newItem);
  saveMenuItems(items);
  return { success: true, message: `"${newItem.name}" added to menu.`, menuItems: items };
};

export const updateMenuItem = (itemId: string, updatedData: { name: string; price: number; category: string }): { success: boolean; message: string; menuItems?: MenuItem[] } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };
  if (!updatedData.name.trim() || updatedData.price <= 0 || !updatedData.category.trim()) {
    return { success: false, message: 'Name, positive price, and category are required for update.' };
  }

  const items = getMenuItems();
  const itemIndex = items.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    return { success: false, message: 'Item not found for update.' };
  }

  // Check if new name conflicts with another existing item's name
  const conflictingItem = items.find(item => item.id !== itemId && item.name.toLowerCase() === updatedData.name.toLowerCase());
  if (conflictingItem) {
    return { success: false, message: `Another menu item with the name "${updatedData.name}" already exists.` };
  }

  items[itemIndex] = { ...items[itemIndex], ...updatedData };
  saveMenuItems(items);
  return { success: true, message: `"${updatedData.name}" updated successfully.`, menuItems: items };
};

export const deleteMenuItem = (itemId: string): { success: boolean; message: string; menuItems?: MenuItem[] } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };

  let items = getMenuItems();
  const itemToDelete = items.find(item => item.id === itemId);
  if (!itemToDelete) {
    return { success: false, message: 'Item not found for deletion.' };
  }

  items = items.filter(item => item.id !== itemId);
  saveMenuItems(items);
  return { success: true, message: `"${itemToDelete.name}" deleted from menu.`, menuItems: items };
};
