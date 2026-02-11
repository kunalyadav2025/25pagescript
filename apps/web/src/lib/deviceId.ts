import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = '25pagescript_device_id';

let cachedDeviceId: string | null = null;

/**
 * Get or generate a unique device ID
 * This ID is used to track likes/dislikes to prevent duplicates
 */
export function getDeviceId(): string {
  // Return cached value if available
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  // Check if we're in the browser
  if (typeof window === 'undefined') {
    // Server-side: return temporary ID
    return `ssr-${uuidv4()}`;
  }

  try {
    // Try to get existing device ID from localStorage
    const existingId = localStorage.getItem(DEVICE_ID_KEY);

    if (existingId) {
      cachedDeviceId = existingId;
      return existingId;
    }

    // Generate new device ID
    const newId = `web-${uuidv4()}`;

    // Store in localStorage
    localStorage.setItem(DEVICE_ID_KEY, newId);

    cachedDeviceId = newId;
    return newId;
  } catch (error) {
    // Fallback: generate a new ID each time (not ideal but works)
    console.warn('Failed to access localStorage, using temporary device ID');
    const fallbackId = `temp-web-${uuidv4()}`;
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
