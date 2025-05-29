
'use client';

const RESTAURANT_CONFIG_KEY = 'restaurant_config_v1'; // Renamed for clarity

const DEFAULT_TABLE_COUNT = 20;
const DEFAULT_TAX_RATE = 0.08; // Stored as decimal, e.g., 0.08 for 8%
const DEFAULT_RESTAURANT_NAME = "Gastronomic Gatherer";
const DEFAULT_RESTAURANT_ADDRESS = "123 Foodie Lane, Flavor Town, USA";

export interface RestaurantConfig {
  tableCount: number;
  taxRate: number;
  restaurantName: string;
  restaurantAddress: string;
}

const getStoredRestaurantConfig = (): RestaurantConfig | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(RESTAURANT_CONFIG_KEY);
  try {
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Error parsing restaurant config from localStorage", e);
    return null;
  }
};

export const initializeDefaultRestaurantConfig = (): void => {
  if (typeof window === 'undefined') return;
  const config = getStoredRestaurantConfig();
  if (!config) {
    localStorage.setItem(RESTAURANT_CONFIG_KEY, JSON.stringify({
      tableCount: DEFAULT_TABLE_COUNT,
      taxRate: DEFAULT_TAX_RATE,
      restaurantName: DEFAULT_RESTAURANT_NAME,
      restaurantAddress: DEFAULT_RESTAURANT_ADDRESS,
    }));
  } else {
    // Ensure all fields exist, add defaults if not (for migrations)
    const updatedConfig = {
      tableCount: config.tableCount !== undefined ? config.tableCount : DEFAULT_TABLE_COUNT,
      taxRate: config.taxRate !== undefined ? config.taxRate : DEFAULT_TAX_RATE,
      restaurantName: config.restaurantName !== undefined ? config.restaurantName : DEFAULT_RESTAURANT_NAME,
      restaurantAddress: config.restaurantAddress !== undefined ? config.restaurantAddress : DEFAULT_RESTAURANT_ADDRESS,
    };
    if (JSON.stringify(config) !== JSON.stringify(updatedConfig)) {
      localStorage.setItem(RESTAURANT_CONFIG_KEY, JSON.stringify(updatedConfig));
    }
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  initializeDefaultRestaurantConfig();
}

export const getFullRestaurantConfig = (): RestaurantConfig => {
  const config = getStoredRestaurantConfig();
  return config || {
    tableCount: DEFAULT_TABLE_COUNT,
    taxRate: DEFAULT_TAX_RATE,
    restaurantName: DEFAULT_RESTAURANT_NAME,
    restaurantAddress: DEFAULT_RESTAURANT_ADDRESS,
  };
};

export const getTableCount = (): number => {
  return getFullRestaurantConfig().tableCount;
};

export const getTableNumbersArray = (): number[] => {
  const count = getTableCount();
  return Array.from({ length: count }, (_, i) => i + 1);
};

export const getTaxRate = (): number => {
  return getFullRestaurantConfig().taxRate;
};

export const getRestaurantName = (): string => {
  return getFullRestaurantConfig().restaurantName;
};

export const getRestaurantAddress = (): string => {
  return getFullRestaurantConfig().restaurantAddress;
};

export const saveRestaurantSettings = (newSettings: Partial<RestaurantConfig>): { success: boolean; message: string } => {
  if (typeof window === 'undefined') return { success: false, message: 'localStorage not available' };
  
  const currentConfig = getFullRestaurantConfig();
  const updatedConfig = { ...currentConfig, ...newSettings };

  // Validate specific fields
  if (newSettings.tableCount !== undefined) {
    const tc = Number(newSettings.tableCount);
    if (isNaN(tc) || tc <= 0 || tc > 100) {
      return { success: false, message: 'Please enter a valid number of tables (1-100).' };
    }
    updatedConfig.tableCount = tc;
  }
  if (newSettings.taxRate !== undefined) {
    const tr = Number(newSettings.taxRate);
     // Assuming tax rate is entered as percentage like 8 for 8%
    if (isNaN(tr) || tr < 0 || tr > 100) {
      return { success: false, message: 'Please enter a valid tax rate (0-100).' };
    }
    updatedConfig.taxRate = tr / 100; // Store as decimal
  }
  if (newSettings.restaurantName !== undefined && !newSettings.restaurantName.trim()){
      return { success: false, message: 'Restaurant name cannot be empty.' };
  }
   if (newSettings.restaurantAddress !== undefined && !newSettings.restaurantAddress.trim()){
      return { success: false, message: 'Restaurant address cannot be empty.' };
  }


  localStorage.setItem(RESTAURANT_CONFIG_KEY, JSON.stringify(updatedConfig));
  return { success: true, message: 'Restaurant settings updated successfully.' };
};
