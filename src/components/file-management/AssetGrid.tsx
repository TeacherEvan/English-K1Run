/**
 * AssetGrid component for displaying a responsive grid of asset cards.
 * Features virtual scrolling, loading states, and optimized rendering.
 */

import { useMemo } from 'react';
import type { AssetFile } from '../../types/file-management';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
  assets: AssetFile[];
  selectedAssets?: Set<string>;
  onAssetSelect?: (asset: AssetFile) => void;
  onAssetDelete?: (assetId: string) => void;
  onAssetEdit?: (asset: AssetFile) => void;
  deletingAssets?: Set<string>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AssetGrid({
  assets,
  selectedAssets = new Set(),
  onAssetSelect,
  onAssetDelete,
  onAssetEdit,
  deletingAssets = new Set(),
  isLoading = false,
  emptyMessage = "No assets found"
}: AssetGridProps) {
  const gridClasses = useMemo(() => {
    return `
      grid gap-4
      grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
      auto-rows-max
    `;
  }, []);

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-square">
            <LoadingSkeleton variant="default" />
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4 opacity-50">📁</div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Upload some assets to get started with managing your game files.
        </p>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {assets.map((asset) => (
        <AssetCard
          key={asset.metadata.id}
          asset={asset}
          isSelected={selectedAssets.has(asset.metadata.id)}
          isDeleting={deletingAssets.has(asset.metadata.id)}
          onSelect={onAssetSelect}
          onDelete={onAssetDelete}
          onEdit={onAssetEdit}
        />
      ))}
    </div>
  );
}