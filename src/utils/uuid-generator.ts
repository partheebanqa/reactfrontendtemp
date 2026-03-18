/**
 * Secure UUID generation for assertion IDs
 * Prevents collisions that can occur with Date.now() or Math.random()
 */

/**
 * Generate cryptographically secure UUID v4
 * Uses crypto.randomUUID when available, falls back to crypto.getRandomValues
 */
export const generateSecureUUID = (): string => {
  // Modern browsers support crypto.randomUUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Set version (4) and variant bits as per RFC 4122
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant 10

    const hex = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');

    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
  }

  // Last resort fallback (should never happen in modern browsers)
  console.warn('[UUID] Using insecure UUID generation fallback');
  return `${Date.now()}-${Math.random().toString(36).substring(2)}-${Math.random().toString(36).substring(2)}`;
};

/**
 * Track generated IDs to detect collisions in development mode
 */
const generatedIds = new Set<string>();

/**
 * Generate a unique assertion ID with collision detection
 * @param maxAttempts - Maximum number of attempts to generate unique ID
 * @returns Unique UUID string
 */
export const generateUniqueAssertionId = (maxAttempts = 5): string => {
  for (let i = 0; i < maxAttempts; i++) {
    const id = generateSecureUUID();

    // In development, check for collisions
    if (process.env.NODE_ENV === 'development') {
      if (!generatedIds.has(id)) {
        generatedIds.add(id);
        return id;
      }
      console.error('[UUID] Collision detected, regenerating...');
    } else {
      return id;
    }
  }

  throw new Error(
    `[UUID] Failed to generate unique ID after ${maxAttempts} attempts`,
  );
};

/**
 * Clear the collision detection set (useful for testing)
 */
export const clearGeneratedIds = (): void => {
  generatedIds.clear();
};
