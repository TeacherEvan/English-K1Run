/**
 * Core file management API for the educational game app.
 * Provides high-level functions for asset CRUD operations using IndexedDB.
 */

import type {
  AssetCategory,
  AssetFile,
  AssetMetadata,
  AssetQuery,
  AssetSearchResult,
  BulkOperationResult,
  FileManagerEvent,
  FileManagerSubscription,
  FileOperationResult,
} from "../../types/file-management";
import { generateUniqueIdentifier } from "../semantic-utils";
import { assetDatabase } from "./database";

/**
 * Generate a unique ID for assets
 */
function generateAssetId(): string {
  return generateUniqueIdentifier("asset");
}

/**
 * Calculate MD5 checksum for integrity checking (simplified)
 */
async function calculateChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substr(0, 16);
}

/**
 * Create AssetMetadata from File object
 */
async function createAssetMetadata(
  file: File,
  category: AssetCategory,
  tags: string[] = [],
): Promise<AssetMetadata> {
  const now = new Date();
  const checksum = await calculateChecksum(file);

  return {
    id: generateAssetId(),
    name: file.name,
    extension: file.name.split(".").pop()?.toLowerCase() || "",
    mimeType: file.type,
    size: file.size,
    category,
    priority: "common", // Default priority
    tags,
    description: "",
    createdAt: now,
    updatedAt: now,
    checksum,
  };
}

/**
 * Upload a game asset to storage
 */
export async function uploadGameAsset(
  file: File,
  category: AssetCategory,
  tags: string[] = [],
  description?: string,
): Promise<FileOperationResult> {
  try {
    // Validate file
    if (!file || file.size === 0) {
      return { success: false, error: "Invalid file provided" };
    }

    // Check file size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return { success: false, error: "File size exceeds 50MB limit" };
    }

    const metadata = await createAssetMetadata(file, category, tags);
    if (description) {
      metadata.description = description;
    }

    // Store in database
    await assetDatabase.assets.add({ ...metadata, blob: file });

    // Emit event for reactive updates
    emitEvent({ type: "asset-added", asset: { metadata, blob: file } });

    return { success: true, assetId: metadata.id };
  } catch (error) {
    console.error("[FileManager] Upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Retrieve asset metadata by ID
 */
export async function retrieveAssetMetadata(
  assetId: string,
): Promise<AssetMetadata | null> {
  try {
    const record = await assetDatabase.assets.get(assetId);
    if (!record) return null;

    const { blob, ...metadata } = record;
    return metadata;
  } catch (error) {
    console.error("[FileManager] Failed to retrieve metadata:", error);
    return null;
  }
}

/**
 * Retrieve full asset (metadata + blob) by ID
 */
export async function retrieveAssetFile(
  assetId: string,
): Promise<AssetFile | null> {
  try {
    const record = await assetDatabase.assets.get(assetId);
    if (!record) return null;

    const { blob, ...metadata } = record;
    return { metadata, blob };
  } catch (error) {
    console.error("[FileManager] Failed to retrieve asset:", error);
    return null;
  }
}

/**
 * Remove an asset from storage
 */
export async function removeAssetFile(
  assetId: string,
): Promise<FileOperationResult> {
  try {
    const exists = await assetDatabase.assets.get(assetId);
    if (!exists) {
      return { success: false, error: "Asset not found" };
    }

    await assetDatabase.assets.delete(assetId);

    // Emit event
    emitEvent({ type: "asset-deleted", assetId });

    return { success: true };
  } catch (error) {
    console.error("[FileManager] Delete failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Update asset metadata
 */
export async function updateAssetMetadata(
  assetId: string,
  updates: Partial<
    Pick<AssetMetadata, "name" | "tags" | "description" | "priority">
  >,
): Promise<FileOperationResult> {
  try {
    const existing = await assetDatabase.assets.get(assetId);
    if (!existing) {
      return { success: false, error: "Asset not found" };
    }

    const updatedMetadata = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await assetDatabase.assets.put(updatedMetadata);

    // Emit event
    emitEvent({
      type: "asset-updated",
      asset: { metadata: updatedMetadata, blob: existing.blob },
    });

    return { success: true };
  } catch (error) {
    console.error("[FileManager] Update failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

/**
 * Query assets with advanced filtering and sorting
 */
export async function queryAssetIndex(
  query: AssetQuery,
): Promise<AssetSearchResult> {
  try {
    let collection = assetDatabase.assets.orderBy("createdAt").reverse();

    // Apply filters
    if (query.category) {
      collection = collection.filter(
        (asset) => asset.category === query.category,
      );
    }

    if (query.priority) {
      collection = collection.filter(
        (asset) => asset.priority === query.priority,
      );
    }

    if (query.tags && query.tags.length > 0) {
      collection = collection.filter((asset) =>
        query.tags!.some((tag) => asset.tags.includes(tag)),
      );
    }

    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      collection = collection.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchTerm) ||
          asset.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          (asset.description &&
            asset.description.toLowerCase().includes(searchTerm)),
      );
    }

    // Apply sorting
    if (query.sortBy && query.sortBy !== "createdAt") {
      collection = collection.orderBy(query.sortBy);
      if (query.sortOrder === "asc") {
        collection = collection.reverse();
      }
    }

    // Apply pagination
    const total = await collection.count();
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const assets = await collection.offset(offset).limit(limit).toArray();

    return {
      assets: assets.map(({ blob, ...metadata }) => ({ metadata, blob })),
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("[FileManager] Query failed:", error);
    return { assets: [], total: 0, hasMore: false };
  }
}

/**
 * Enumerate stored assets (simplified listing)
 */
export async function enumerateStoredAssets(
  category?: AssetCategory,
): Promise<AssetMetadata[]> {
  try {
    let collection = assetDatabase.assets.orderBy("name");

    if (category) {
      collection = collection.filter((asset) => asset.category === category);
    }

    const records = await collection.toArray();
    return records.map(({ blob, ...metadata }) => metadata);
  } catch (error) {
    console.error("[FileManager] Enumeration failed:", error);
    return [];
  }
}

/**
 * Batch remove multiple assets
 */
export async function batchRemoveAssets(
  assetIds: string[],
): Promise<BulkOperationResult> {
  const successful: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const id of assetIds) {
    const result = await removeAssetFile(id);
    if (result.success) {
      successful.push(id);
    } else {
      failed.push({ id, error: result.error || "Unknown error" });
    }
  }

  // Emit bulk operation event
  emitEvent({
    type: "bulk-operation-completed",
    result: { successful, failed, total: assetIds.length },
  });

  return { successful, failed, total: assetIds.length };
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  return await assetDatabase.getStats();
}

/**
 * Clear all stored assets (dangerous operation)
 */
export async function clearAllAssets(): Promise<FileOperationResult> {
  try {
    await assetDatabase.clearAllData();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Clear failed",
    };
  }
}

// Event system for reactive updates
const eventListeners: ((event: FileManagerEvent) => void)[] = [];

function emitEvent(event: FileManagerEvent) {
  eventListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error("[FileManager] Event listener error:", error);
    }
  });
}

/**
 * Subscribe to file manager events
 */
export function subscribeToFileEvents(
  callback: (event: FileManagerEvent) => void,
): FileManagerSubscription {
  eventListeners.push(callback);

  return {
    unsubscribe: () => {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    },
  };
}

/**
 * Check if file manager is ready
 */
export async function isFileManagerReady(): Promise<boolean> {
  return await assetDatabase.isHealthy();
}
