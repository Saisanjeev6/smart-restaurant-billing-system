// IMPORTANT: This is a simplified auth system for prototyping purposes only.
// It stores passwords in plaintext in localStorage, which is INSECURE for production.
// DO NOT use this approach in a real application.

'use client'; // This module interacts with localStorage, so it's client-side.

import type { User, NewUserCredentials } from '@/types'; // Assuming User type will be expanded

const USERS_KEY = 'restaurant_users_v2'; // Changed key to reset if old one exists
const CURRENT_USER_KEY = 'restaurant_current_user_v2';

const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const storedUsers = localStorage.getItem(USERS_KEY);
  return storedUsers ? JSON.parse(storedUsers) : [];
};

const initializeUsers = () => {
  if (typeof window === 'undefined') return;
  let users = getStoredUsers();
  if (users.length === 0) {
    users.push({ username: 'admin', password: 'admin', role: 'admin', id: 'user-admin-01' });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  initializeUsers();
}

export const login = (username: string, passwordInput: string): User | null => {
  if (typeof window === 'undefined') return null;
  const users = getStoredUsers();
  const user = users.find(u => u.username === username && u.password === passwordInput);

  if (user) {
    const currentUserData = { username: user.username, role: user.role, id: user.id };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUserData));
    return currentUserData;
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  return null;
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

export const createUser = (newUser: NewUserCredentials): { success: boolean; message: string; users?: User[] } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };
  if (newUser.role === 'admin') {
    return { success: false, message: 'Cannot create admin users through this interface.' };
  }

  const users = getStoredUsers();
  if (users.find(u => u.username === newUser.username)) {
    return { success: false, message: 'Username already exists.' };
  }

  const userWithId: User = { 
    ...newUser, 
    id: `user-${newUser.role}-${Date.now()}` 
  };
  users.push(userWithId);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true, message: `${newUser.role} created successfully.`, users: users.filter(u => u.role !== 'admin') };
};

export const getUsers = (role?: 'waiter'): User[] => {
  if (typeof window === 'undefined') return [];
  const users = getStoredUsers();
  if (role) {
    return users.filter(u => u.role === role);
  }
  return users.filter(u => u.role !== 'admin'); // By default, don't show admin details
};
