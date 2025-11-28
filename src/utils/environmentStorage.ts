/**
 * Utility functions for managing environment selection persistence
 */

const ENV_STORAGE_PREFIX = 'dm:activeEnv:';

/**
 * Get the localStorage key for a workspace's active environment
 */
export const getEnvStorageKey = (workspaceId?: string | null): string => {
  return `${ENV_STORAGE_PREFIX}${workspaceId ?? 'default'}`;
};

/**
 * Save the selected environment ID to localStorage
 */
export const saveActiveEnvironment = (
  workspaceId: string | undefined | null,
  environmentId: string
): void => {
  try {
    const key = getEnvStorageKey(workspaceId);
    localStorage.setItem(key, JSON.stringify({ id: environmentId }));
  } catch (error) {
    console.warn('Failed to save active environment to localStorage:', error);
  }
};

/**
 * Get the saved environment ID from localStorage
 */
export const getSavedEnvironmentId = (
  workspaceId: string | undefined | null
): string | null => {
  try {
    const key = getEnvStorageKey(workspaceId);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.id || null;
    }
  } catch (error) {
    console.warn('Failed to read active environment from localStorage:', error);
  }
  return null;
};

/**
 * Remove the saved environment for a workspace
 */
export const clearSavedEnvironment = (
  workspaceId: string | undefined | null
): void => {
  try {
    const key = getEnvStorageKey(workspaceId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear saved environment from localStorage:', error);
  }
};

/**
 * Clear all environment storage (useful for logout)
 */
export const clearAllEnvironmentStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(ENV_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all environment storage:', error);
  }
};
