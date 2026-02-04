import type { ErrorInfo, ReactNode } from "react";

/**
 * Error category for scoped recovery and messaging.
 */
export type ErrorCategory =
  | "game-logic"
  | "audio"
  | "rendering"
  | "network"
  | "performance"
  | "unknown";

/**
 * Props for the CategoryErrorBoundary wrapper.
 */
export interface CategoryErrorBoundaryProps {
  /** Child components to render. */
  children: ReactNode;
  /** Error category for specialized handling. */
  category: ErrorCategory;
  /** Optional custom fallback component. */
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    reset: () => void,
    category: ErrorCategory,
  ) => ReactNode;
  /** Optional error handler callback. */
  onError?: (
    error: Error,
    errorInfo: ErrorInfo,
    category: ErrorCategory,
  ) => void;
  /** Whether to enable safe mode fallback. */
  enableSafeMode?: boolean;
}
