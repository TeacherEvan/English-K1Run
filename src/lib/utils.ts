import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS class names.
 *
 * Combines multiple class name sources (strings, arrays, objects) and intelligently
 * merges conflicting Tailwind classes, keeping only the last occurrence.
 *
 * @param inputs - Variable number of class name inputs (strings, arrays, objects, etc.)
 * @returns Merged and deduplicated class string
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500') // => 'px-4 py-2 bg-blue-500'
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active-class') // => 'base-class active-class' (if isActive)
 *
 * // Conflicting Tailwind classes (last wins)
 * cn('p-4', 'p-6') // => 'p-6'
 *
 * // Complex composition
 * cn('px-4 py-2', { 'bg-blue-500': true, 'text-white': false }) // => 'px-4 py-2 bg-blue-500'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats milliseconds into a time string (MM:SS.T)
 * Used for displaying best times in game menus.
 *
 * @param ms - Time in milliseconds
 * @returns Formatted time string
 */
export function formatBestTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}
