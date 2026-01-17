/**
 * Dexie.js database setup for file management in the educational game app.
 * Provides IndexedDB-based storage for game assets with versioning and error handling.
 */

import Dexie, { type Table } from 'dexie';
import type { AssetMetadata, AssetFile } from '../../types/file-management';

/**
 * Database schema version and table definitions
 */
export class AssetDatabase extends Dexie {
  /** Main assets table storing metadata and blobs */
  assets!: Table<AssetMetadata & { blob: Blob }, string>;

  constructor() {
    super('AssetDatabase');

    this.version(1).stores({
      assets: '&id, name, extension, mimeType, size, category, priority, tags, createdAt, updatedAt, checksum'
    });

    // Add indexes for efficient querying
    this.version(2).stores({
      assets: '&id, name, extension, mimeType, size, category, priority, tags, createdAt, updatedAt, checksum, *tags'
    });

    // Handle database upgrade errors
    this.on('versionchange', (event) => {
      console.warn('[AssetDatabase] Version change detected:', event);
    });

    this.on('blocked', () => {
      console.error('[AssetDatabase] Database blocked - another tab has it open');
    });

    this.on('ready', () => {
      console.log('[AssetDatabase] Database ready');
    });
  }

  /**
   * Initialize database with error handling
   */
  async initialize(): Promise<void> {
    try {
      await this.open();
      console.log('[AssetDatabase] Successfully opened database');
    } catch (error) {
      console.error('[AssetDatabase] Failed to open database:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close database connection
   */
  async closeDatabase(): Promise<void> {
    try {
      await this.close();
      console.log('[AssetDatabase] Database closed');
    } catch (error) {
      console.warn('[AssetDatabase] Error closing database:', error);
    }
  }

  /**
   * Clear all data (useful for testing or reset)
   */
  async clearAllData(): Promise<void> {
    try {
      await this.assets.clear();
      console.log('[AssetDatabase] All data cleared');
    } catch (error) {
      console.error('[AssetDatabase] Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const assets = await this.assets.toArray();
      const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
      return { count: assets.length, totalSize };
    } catch (error) {
      console.error('[AssetDatabase] Failed to get stats:', error);
      return { count: 0, totalSize: 0 };
    }
  }

  /**
   * Check if database is available and healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.assets.count();
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const assetDatabase = new AssetDatabase();

// Initialize on module load
assetDatabase.initialize().catch((error) => {
  console.error('[AssetDatabase] Initialization failed:', error);
});

// Export for testing
export { Dexie };