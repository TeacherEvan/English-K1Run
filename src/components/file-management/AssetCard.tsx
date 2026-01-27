/**
 * AssetCard component for displaying individual assets in the file management UI.
 * Features premium animations, lazy loading, and interactive elements.
 */

import { useCallback, useState } from 'react';
import type { AssetFile } from '../../types/file-management';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface AssetCardProps {
  asset: AssetFile;
  onSelect?: (asset: AssetFile) => void;
  onDelete?: (assetId: string) => void;
  onEdit?: (asset: AssetFile) => void;
  isSelected?: boolean;
  isDeleting?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'audio': return '🎵';
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'document': return '📄';
    default: return '📁';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'common': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'rare': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export function AssetCard({ asset, onSelect, onDelete, onEdit, isSelected, isDeleting }: AssetCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleCardClick = useCallback(() => {
    onSelect?.(asset);
  }, [asset, onSelect]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(asset.metadata.id);
  }, [asset.metadata.id, onDelete]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(asset);
  }, [asset, onEdit]);

  const isImage = asset.metadata.category === 'image';
  const previewUrl = isImage && asset.blob ? URL.createObjectURL(asset.blob) : null;

  return (
    <TooltipProvider>
      <Card
        className={`
          group relative cursor-pointer transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-xl hover:shadow-primary/20
          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
          bg-card/95 backdrop-blur-sm border-border/50
        `}
        onClick={handleCardClick}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs">✓</span>
            </div>
          </div>
        )}

        {/* Asset preview */}
        <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
          {isImage ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                  <div className="text-4xl opacity-50">{getCategoryIcon(asset.metadata.category)}</div>
                </div>
              )}
              {previewUrl && !imageError && (
                <img
                  src={previewUrl}
                  alt={asset.metadata.name}
                  className={`
                    w-full h-full object-cover transition-opacity duration-300
                    ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  `}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                />
              )}
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{getCategoryIcon(asset.metadata.category)}</div>
                    <div className="text-sm text-muted-foreground">Preview unavailable</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">{getCategoryIcon(asset.metadata.category)}</div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
        </div>

        {/* Asset info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm truncate" title={asset.metadata.name}>
              {asset.metadata.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(asset.metadata.size)}
            </p>
          </div>

          {/* Tags and priority */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {asset.metadata.category}
              </Badge>
              <Badge className={`text-xs ${getPriorityColor(asset.metadata.priority)}`}>
                {asset.metadata.priority}
              </Badge>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                    onClick={handleEditClick}
                  >
                    ✏️
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit metadata</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    🗑️
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete asset</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Description */}
          {asset.metadata.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {asset.metadata.description}
            </p>
          )}

          {/* Tags */}
          {asset.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {asset.metadata.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {asset.metadata.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{asset.metadata.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}