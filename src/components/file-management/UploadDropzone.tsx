/**
 * UploadDropzone component for drag-and-drop file uploads.
 * Features premium animations, progress indicators, and accessibility.
 */

import { useState, useCallback, useRef } from 'react';
import { AssetCategory } from '../../types/file-management';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[], category: AssetCategory) => void;
  acceptedTypes?: string;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  audio: 'audio/*',
  image: 'image/*',
  video: 'video/*',
  document: '.pdf,.doc,.docx,.txt',
  other: '*/*'
};

const CATEGORY_LABELS = {
  audio: 'Audio Files',
  image: 'Images',
  video: 'Videos',
  document: 'Documents',
  other: 'Files'
};

export function UploadDropzone({
  onFilesSelected,
  acceptedTypes = '*/*',
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 10,
  isUploading = false,
  uploadProgress = 0,
  disabled = false
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      if (file.size > maxFileSize) {
        console.warn(`File "${file.name}" exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`);
        continue;
      }

      // Basic type validation based on category
      const categoryType = ACCEPTED_TYPES[selectedCategory];
      if (categoryType !== '*/*' && !file.type.match(categoryType.replace('*', '.*'))) {
        console.warn(`File "${file.name}" does not match expected type for ${selectedCategory}`);
        // Still allow it but warn
      }

      validFiles.push(file);
    }

    return validFiles.slice(0, maxFiles);
  }, [maxFileSize, maxFiles, selectedCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    const validFiles = validateFiles(files);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles, selectedCategory);
    }
  }, [disabled, isUploading, validateFiles, onFilesSelected, selectedCategory]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles, selectedCategory);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateFiles, onFilesSelected, selectedCategory]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCategoryChange = useCallback((category: AssetCategory) => {
    setSelectedCategory(category);
  }, []);

  const isActive = isDragOver && !disabled && !isUploading;

  return (
    <Card className={`
      relative transition-all duration-300 ease-out
      ${isActive ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      bg-card/95 backdrop-blur-sm border-border/50 border-dashed
    `}>
      <div
        className="p-8 text-center"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Upload icon with animation */}
        <div className={`
          mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-300
          ${isActive ? 'bg-primary scale-110' : 'bg-muted'}
          ${isUploading ? 'animate-pulse' : ''}
        `}>
          {isUploading ? (
            <div className="text-2xl">⏳</div>
          ) : (
            <div className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-125' : ''}`}>
              📁
            </div>
          )}
        </div>

        {/* Upload text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isUploading ? 'Uploading...' : 'Drop files here'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isUploading
              ? 'Please wait while we process your files'
              : `Or click to browse. Max ${maxFiles} files, up to ${(maxFileSize / (1024 * 1024)).toFixed(0)}MB each.`
            }
          </p>
        </div>

        {/* Category selector */}
        {!isUploading && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">Select file type:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(category as AssetCategory)}
                  disabled={disabled}
                  className="transition-all duration-200"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="mt-6 space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {uploadProgress}% complete
            </p>
          </div>
        )}

        {/* Browse button */}
        {!isUploading && (
          <div className="mt-6">
            <Button
              onClick={handleBrowseClick}
              disabled={disabled}
              className="transition-all duration-200 hover:scale-105"
            >
              Browse Files
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES[selectedCategory]}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {/* Drag overlay */}
      {isActive && (
        <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📂</div>
            <p className="font-semibold text-primary">Drop files to upload</p>
          </div>
        </div>
      )}
    </Card>
  );
}