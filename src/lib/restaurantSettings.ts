
'use client';

const TABLE_CONFIG_KEY = 'restaurant_table_config_v1';
const DEFAULT_TABLE_COUNT = 20;

interface TableConfig {
  count: number;
}

const getStoredTableConfig = (): TableConfig | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(TABLE_CONFIG_KEY);
  try {
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Error parsing table config from localStorage", e);
    return null;
  }
};

export const initializeDefaultTableConfig = (): void => {
  if (typeof window === 'undefined') return;
  const config = getStoredTableConfig();
  if (!config) {
    localStorage.setItem(TABLE_CONFIG_KEY, JSON.stringify({ count: DEFAULT_TABLE_COUNT }));
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  initializeDefaultTableConfig();
}

export const getTableCount = (): number => {
  const config = getStoredTableConfig();
  return config ? config.count : DEFAULT_TABLE_COUNT;
};

export const getTableNumbersArray = (): number[] => {
  const count = getTableCount();
  return Array.from({ length: count }, (_, i) => i + 1);
};

export const saveTableCount = (count: number): { success: boolean; message: string } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };
  if (isNaN(count) || count <= 0 || count > 100) { // Added a max limit for sanity
    return { success: false, message: 'Please enter a valid number of tables (1-100).' };
  }
  localStorage.setItem(TABLE_CONFIG_KEY, JSON.stringify({ count }));
  return { success: true, message: `Number of tables updated to ${count}.` };
};
