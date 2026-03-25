/**
 * Storage Manager - IndexedDB with localStorage fallback
 *
 * Features:
 * - IndexedDB for large data storage (no 5MB limit)
 * - Automatic quota management and cleanup
 * - localStorage fallback for compatibility
 * - Cross-tab synchronization support
 * - Encryption for sensitive data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AssertionDB extends DBSchema {
  assertions: {
    key: string; // requestId
    value: {
      requestId: string;
      assertions: any[];
      timestamp: number;
      chainId?: string;
      size: number; // Size in bytes
    };
    indexes: {
      'by-timestamp': number;
      'by-chain': string;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      totalSize: number;
      totalEntries: number;
      lastCleanup: number;
    };
  };
}

const DB_NAME = 'ApiTestingDB';
const DB_VERSION = 1;
const MAX_ENTRIES = 100;
const MAX_TOTAL_SIZE_MB = 50; // 50MB limit
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

class StorageManager {
  private db: IDBPDatabase<AssertionDB> | null = null;
  private initPromise: Promise<IDBPDatabase<AssertionDB>> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<IDBPDatabase<AssertionDB>> {
    if (this.db) return this.db;

    // Prevent multiple concurrent initializations
    if (this.initPromise) return this.initPromise;

    this.initPromise = openDB<AssertionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create assertions store
        if (!db.objectStoreNames.contains('assertions')) {
          const assertionStore = db.createObjectStore('assertions', {
            keyPath: 'requestId',
          });
          assertionStore.createIndex('by-timestamp', 'timestamp');
          assertionStore.createIndex('by-chain', 'chainId');
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });

    this.db = await this.initPromise;
    return this.db;
  }

  /**
   * Save assertions to IndexedDB with quota management
   */
  async saveAssertions(
    requestId: string,
    assertions: any[],
    chainId?: string,
  ): Promise<boolean> {
    try {
      const db = await this.init();

      const data = JSON.stringify(assertions);
      const size = new Blob([data]).size;

      // Check if data is too large (>10MB single entry)
      if (size > 10 * 1024 * 1024) {
        console.error(
          `[Storage] Assertion data too large: ${(size / 1024 / 1024).toFixed(1)}MB`,
        );
        return false;
      }

      await db.put('assertions', {
        requestId,
        assertions,
        timestamp: Date.now(),
        chainId,
        size,
      });

      // Update metadata
      await this.updateMetadata();

      // Check if cleanup needed
      await this.cleanupIfNeeded();

      return true;
    } catch (error) {
      console.error('[Storage] Failed to save to IndexedDB:', error);

      // Fallback to localStorage
      return this.fallbackToLocalStorage(requestId, assertions);
    }
  }

  /**
   * Fallback to localStorage with size checks
   */
  private async fallbackToLocalStorage(
    requestId: string,
    assertions: any[],
  ): Promise<boolean> {
    try {
      const data = JSON.stringify({ requestId, assertions });
      const sizeInMB = new Blob([data]).size / (1024 * 1024);

      // Check size before attempting to save
      if (sizeInMB > 4) {
        console.warn(
          `[Storage] Data too large for localStorage: ${sizeInMB.toFixed(1)}MB`,
        );
        return false;
      }

      localStorage.setItem(`assertions_${requestId}`, data);
      return true;
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.error('[Storage] localStorage quota exceeded');

        // Try to clear old entries
        this.clearOldLocalStorageEntries();

        // Try one more time
        try {
          localStorage.setItem(
            `assertions_${requestId}`,
            JSON.stringify({ requestId, assertions }),
          );
          return true;
        } catch {
          return false;
        }
      }

      console.error('[Storage] localStorage error:', e);
      return false;
    }
  }

  /**
   * Get assertions from storage
   */
  async getAssertions(requestId: string): Promise<any[] | null> {
    try {
      const db = await this.init();
      const record = await db.get('assertions', requestId);
      return record?.assertions || null;
    } catch (error) {
      console.error('[Storage] Failed to get from IndexedDB:', error);

      // Fallback to localStorage
      try {
        const data = localStorage.getItem(`assertions_${requestId}`);
        if (data) {
          const parsed = JSON.parse(data);
          return parsed.assertions;
        }
      } catch (e) {
        console.error('[Storage] localStorage fallback failed:', e);
      }

      return null;
    }
  }

  /**
   * Get all assertions for a specific chain
   */
  async getAllAssertionsByChain(
    chainId: string,
  ): Promise<Record<string, any[]>> {
    try {
      const db = await this.init();
      const tx = db.transaction('assertions', 'readonly');
      const index = tx.store.index('by-chain');
      const records = await index.getAll(chainId);

      const result: Record<string, any[]> = {};
      records.forEach((record) => {
        result[record.requestId] = record.assertions;
      });

      return result;
    } catch (error) {
      console.error('[Storage] Failed to get chain assertions:', error);
      return {};
    }
  }

  /**
   * Delete assertions for a specific request
   */
  async deleteAssertions(requestId: string): Promise<boolean> {
    try {
      const db = await this.init();
      await db.delete('assertions', requestId);

      // Also try localStorage
      localStorage.removeItem(`assertions_${requestId}`);

      return true;
    } catch (error) {
      console.error('[Storage] Failed to delete:', error);
      return false;
    }
  }

  /**
   * Update metadata tracking
   */
  private async updateMetadata(): Promise<void> {
    try {
      const db = await this.init();
      const tx = db.transaction('assertions', 'readonly');
      const allRecords = await tx.store.getAll();

      const totalSize = allRecords.reduce(
        (sum, record) => sum + record.size,
        0,
      );
      const totalEntries = allRecords.length;

      await db.put('metadata', {
        key: 'stats',
        totalSize,
        totalEntries,
        lastCleanup: Date.now(),
      });
    } catch (error) {
      console.error('[Storage] Failed to update metadata:', error);
    }
  }

  /**
   * Cleanup old entries if needed
   */
  private async cleanupIfNeeded(): Promise<void> {
    try {
      const db = await this.init();
      const metadata = await db.get('metadata', 'stats');

      if (!metadata) return;

      const now = Date.now();
      const shouldCleanupByTime =
        now - metadata.lastCleanup > CLEANUP_INTERVAL_MS;
      const shouldCleanupByCount = metadata.totalEntries > MAX_ENTRIES;
      const shouldCleanupBySize =
        metadata.totalSize / 1024 / 1024 > MAX_TOTAL_SIZE_MB;

      if (
        !shouldCleanupByTime &&
        !shouldCleanupByCount &&
        !shouldCleanupBySize
      ) {
        return;
      }

      console.log('[Storage] Running cleanup...', {
        entries: metadata.totalEntries,
        sizeMB: (metadata.totalSize / 1024 / 1024).toFixed(1),
      });

      // Get all records sorted by timestamp (oldest first)
      const tx = db.transaction('assertions', 'readwrite');
      const index = tx.store.index('by-timestamp');
      const allRecords = await index.getAll();

      // Sort by timestamp (oldest first)
      allRecords.sort((a, b) => a.timestamp - b.timestamp);

      // Determine how many to delete
      let entriesToDelete = 0;
      if (shouldCleanupByCount) {
        entriesToDelete = Math.max(
          entriesToDelete,
          allRecords.length - MAX_ENTRIES,
        );
      }
      if (shouldCleanupBySize) {
        // Delete oldest 25% of entries
        entriesToDelete = Math.max(
          entriesToDelete,
          Math.floor(allRecords.length * 0.25),
        );
      }

      // Delete oldest entries
      for (let i = 0; i < entriesToDelete; i++) {
        await tx.store.delete(allRecords[i].requestId);
      }

      await tx.done;

      console.log(
        `[Storage] Cleanup complete: deleted ${entriesToDelete} entries`,
      );

      // Update metadata
      await this.updateMetadata();
    } catch (error) {
      console.error('[Storage] Cleanup failed:', error);
    }
  }

  /**
   * Clear old localStorage entries
   */
  private clearOldLocalStorageEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const assertionKeys = keys
        .filter((k) => k.startsWith('assertions_'))
        .sort();

      // Remove oldest 50%
      const toRemove = assertionKeys.slice(
        0,
        Math.floor(assertionKeys.length / 2),
      );
      toRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });

      console.log(
        `[Storage] Cleared ${toRemove.length} old localStorage entries`,
      );
    } catch (error) {
      console.error('[Storage] Failed to clear localStorage:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSizeMB: number;
    oldestEntry: number;
    newestEntry: number;
  } | null> {
    try {
      const db = await this.init();
      const metadata = await db.get('metadata', 'stats');

      if (!metadata) return null;

      const tx = db.transaction('assertions', 'readonly');
      const index = tx.store.index('by-timestamp');
      const allRecords = await index.getAll();

      const timestamps = allRecords
        .map((r) => r.timestamp)
        .sort((a, b) => a - b);

      return {
        totalEntries: metadata.totalEntries,
        totalSizeMB: metadata.totalSize / 1024 / 1024,
        oldestEntry: timestamps[0] || 0,
        newestEntry: timestamps[timestamps.length - 1] || 0,
      };
    } catch (error) {
      console.error('[Storage] Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Clear all storage (for testing or user request)
   */
  async clearAll(): Promise<boolean> {
    try {
      const db = await this.init();
      await db.clear('assertions');
      await db.clear('metadata');

      // Clear localStorage entries
      const keys = Object.keys(localStorage);
      keys
        .filter((k) => k.startsWith('assertions_'))
        .forEach((key) => {
          localStorage.removeItem(key);
        });

      console.log('[Storage] All storage cleared');
      return true;
    } catch (error) {
      console.error('[Storage] Failed to clear storage:', error);
      return false;
    }
  }
  /**
   * Save an arbitrary JSON-serialisable value to the metadata store.
   * Used by ResponseViewer to persist extracted variables to IDB (P1-A).
   */
  async saveGeneric(key: string, value: any): Promise<boolean> {
    try {
      const db = await this.init();
      await (db as any).put('metadata', { key, value, timestamp: Date.now() });
      return true;
    } catch (error) {
      console.error('[Storage] saveGeneric failed:', error);
      return false;
    }
  }

  /**
   * Retrieve a previously saved generic value from the metadata store.
   */
  async getGeneric(key: string): Promise<any | null> {
    try {
      const db = await this.init();
      const record = (await db.get('metadata', key)) as any;
      return record?.value ?? null;
    } catch (error) {
      console.error('[Storage] getGeneric failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
