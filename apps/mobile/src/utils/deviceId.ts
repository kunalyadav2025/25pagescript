import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '25pagescript_device_id';

let cachedDeviceId: string | null = null;

/**
 * Get or generate a unique device ID
 * This ID is used to track likes/dislikes to prevent duplicates
 */
export async function getDeviceId(): Promise<string> {
  // Return cached value if available
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    // Try to get existing device ID from secure storage
    const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (existingId) {
      cachedDeviceId = existingId;
      return existingId;
    }

    // Generate new device ID
    const newId = `${Platform.OS}-${uuidv4()}`;

    // Store in secure storage
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);

    cachedDeviceId = newId;
    return newId;
  } catch (error) {
    // Fallback: generate a new ID each time (not ideal but works)
    console.warn('Failed to access secure storage, using temporary device ID');
    const fallbackId = `temp-${Platform.OS}-${uuidv4()}`;
    cachedDeviceId = fallbackId;
    return fallbackId;
  }
}

/**
 * Clear the cached device ID (useful for testing)
 */
export function clearCachedDeviceId(): void {
  cachedDeviceId = null;
}
