/**
 * TypeScript interfaces for file management features in the educational game app.
 * Provides type safety for asset storage, metadata handling, and file operations.
 */

export type AssetCategory = "audio" | "image" | "video" | "document" | "other";

export type AssetPriority = "critical" | "common" | "rare";

export interface AssetMetadata {
  /** Unique identifier for the asset */
  id: string;
  /** Original filename */
  name: string;
  /** File extension (e.g., 'mp3', 'jpg') */
  extension: string;
  /** MIME type (e.g., 'audio/mpeg', 'image/jpeg') */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Asset category for organization */
  category: AssetCategory;
  /** Priority level for loading optimization */
  priority: AssetPriority;
  /** User-defined tags for search and filtering */
  tags: string[];
  /** Description or notes about the asset */
  description?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
  /** MD5 hash for integrity checking */
  checksum?: string;
}

export interface AssetFile {
  /** Metadata for the asset */
  metadata: AssetMetadata;
  /** File blob for storage */
  blob: Blob;
  /** Optional URL for quick access (created on demand) */
  url?: string;
}

export interface AssetQuery {
  /** Search term for name or tags */
  query?: string;
  /** Filter by category */
  category?: AssetCategory;
  /** Filter by priority */
  priority?: AssetPriority;
  /** Filter by tags (AND logic) */
  tags?: string[];
  /** Sort field */
  sortBy?: "name" | "size" | "createdAt" | "updatedAt";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

export interface AssetSearchResult {
  /** Matching assets */
  assets: AssetFile[];
  /** Total count of matching assets */
  total: number;
  /** Has more results available */
  hasMore: boolean;
}

export interface FileOperationResult {
  /** Operation success status */
  success: boolean;
  /** Asset ID if applicable */
  assetId?: string;
  /** Error message if failed */
  error?: string;
}

export interface BulkOperationResult {
  /** Successfully processed asset IDs */
  successful: string[];
  /** Failed operations with error details */
  failed: { id: string; error: string }[];
  /** Total count processed */
  total: number;
}

/**
 * Events emitted by the file manager for reactive updates
 */
export type FileManagerEvent =
  | { type: "asset-added"; asset: AssetFile }
  | { type: "asset-updated"; asset: AssetFile }
  | { type: "asset-deleted"; assetId: string }
  | { type: "bulk-operation-completed"; result: BulkOperationResult };

/**
 * Hook for subscribing to file manager events
 */
export interface FileManagerSubscription {
  unsubscribe: () => void;
}
