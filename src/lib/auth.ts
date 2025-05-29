
// IMPORTANT: This is a simplified auth system for prototyping purposes only.
// It stores passwords in plaintext in localStorage, which is INSECURE for production.
// DO NOT use this approach in a real application.

'use client'; // This module interacts with localStorage, so it's client-side.

import type { User, NewUserCredentials, UserRole } from '@/types'; 

const USERS_KEY = 'restaurant_users_v3'; 
const CURRENT_USER_KEY = 'restaurant_current_user_v3';

const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const storedUsers = localStorage.getItem(USERS_KEY);
  return storedUsers ? JSON.parse(storedUsers) : [];
};

const initializeUsers = () => {
  if (typeof window === 'undefined') return;
  let users = getStoredUsers();
  if (!users.find(u => u.username === 'admin')) {
    users.push({ username: 'admin', password: 'admin', role: 'admin', id: 'user-admin-01' });
  }
  if (!users.find(u => u.username === 'kitchen')) {
    users.push({ username: 'kitchen', password: 'kitchen', role: 'kitchen', id: 'user-kitchen-01' });
  }
  if (!users.find(u => u.username === 'waiter1')) { 
    users.push({ username: 'waiter1', password: 'password', role: 'waiter', id: 'user-waiter-default-001' });
  }

  const uniqueUsersMap = new Map<string, User>();
  users.forEach(user => {
    if (!uniqueUsersMap.has(user.username)) {
      uniqueUsersMap.set(user.username, user);
    }
  });
  const uniqueUsers = Array.from(uniqueUsersMap.values());

  localStorage.setItem(USERS_KEY, JSON.stringify(uniqueUsers));
};

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
  
  const users = getStoredUsers();
  if (users.find(u => u.username === newUser.username)) {
    return { success: false, message: 'Username already exists.' };
  }
  if (!newUser.password || !newUser.password.trim()){
     return { success: false, message: 'Password cannot be empty.' };
  }

  const userWithId: User = { 
    ...newUser, 
    id: `user-${newUser.role}-${Date.now()}` 
  };
  users.push(userWithId);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true, message: `${newUser.role} account created successfully.`, users: getUsers() };
};

export const getUsers = (role?: UserRole): User[] => {
  if (typeof window === 'undefined') return [];
  const users = getStoredUsers();
  if (role) {
    return users.filter(u => u.role === role);
  }
  return users.filter(u => u.role === 'waiter' || u.role === 'kitchen');
};

export const updateUserPassword = (userId: string, newPassword: string): { success: boolean; message: string; users?: User[] } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };
  if (!newPassword.trim()) {
    return { success: false, message: 'New password cannot be empty.' };
  }

  let allUsers = getStoredUsers(); // Get all users, including admin, for modification
  const userIndex = allUsers.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return { success: false, message: 'User not found.' };
  }
  
  // Prevent changing admin password via this UI as a safety, though admin isn't listed.
  if (allUsers[userIndex].role === 'admin') {
    return { success: false, message: 'Admin password cannot be changed through this interface.' };
  }

  allUsers[userIndex].password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
  return { success: true, message: `Password for ${allUsers[userIndex].username} updated.`, users: getUsers() }; // getUsers() filters to non-admin for UI refresh
};

export const deleteUser = (userId: string): { success: boolean; message: string; users?: User[] } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };

  let allUsers = getStoredUsers();
  const userToDelete = allUsers.find(u => u.id === userId);

  if (!userToDelete) {
    return { success: false, message: 'User not found.' };
  }

  if (userToDelete.role === 'admin') {
    return { success: false, message: 'Admin account cannot be deleted.' };
  }

  allUsers = allUsers.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
  return { success: true, message: `User ${userToDelete.username} deleted.`, users: getUsers() };
};
