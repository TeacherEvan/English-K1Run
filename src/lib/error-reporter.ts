/**
 * Global Error Reporting Service
 *
 * Centralized error reporting system that integrates with the existing EventTracker
 * and provides a consistent API for error reporting across the application.
 *
 * Features:
 * - Automatic error categorization
 * - Integration with EventTracker
 * - User-friendly error notifications
 * - Stack trace capture
 * - Context enrichment
 * - Production-ready reporting hooks
 *
 * Usage:
 * ```ts
 * import { errorReporter } from '@/lib/error-reporter'
 *
 * try {
 *   // risky operation
 * } catch (error) {
 *   errorReporter.reportError(error, 'game-logic', { levelId: 1 })
 * }
 * ```
 */

import { eventTracker } from './event-tracker';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ErrorCategory =
  | 'game-logic'
  | 'audio'
  | 'rendering'
  | 'network'
  | 'performance'
  | 'settings'
  | 'user-action'
  | 'unknown';

export interface ErrorContext {
  /** Additional context data */
  [key: string]: unknown;
}

export interface ErrorReport {
  /** Error message */
  message: string;
  /** Error category */
  category: ErrorCategory;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Stack trace if available */
  stack?: string;
  /** Additional context */
  context?: ErrorContext;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Error name/type */
  name?: string;
}

/**
 * Callback for custom error handling (e.g., showing toast notifications)
 */
export type ErrorCallback = (report: ErrorReport) => void;

/**
 * Global Error Reporter
 *
 * Centralized service for reporting and tracking application errors.
 * Integrates with EventTracker and provides hooks for custom error handling.
 */
class ErrorReporter {
  private errorCallbacks: ErrorCallback[] = [];
  private enabled = true;

  /**
   * Report an error to the global error tracking system
   *
   * @param error - Error object or string message
   * @param category - Error category for classification
   * @param context - Additional context information
   * @param severity - Error severity level (auto-detected if not provided)
   */
  reportError(
    error: Error | string,
    category: ErrorCategory = 'unknown',
    context?: ErrorContext,
    severity?: ErrorSeverity
  ): void {
    if (!this.enabled) return;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const detectedSeverity = severity || this.detectSeverity(errorObj, category);

    const report: ErrorReport = {
      message: errorObj.message,
      category,
      severity: detectedSeverity,
      stack: errorObj.stack,
      context,
      timestamp: Date.now(),
      name: errorObj.name,
    };

    // Log to event tracker
    eventTracker.trackError(errorObj, `${category}: ${errorObj.message}`);

    // Log to console in development
    if (import.meta.env.DEV) {
      const severityEmoji = {
        low: '📘',
        medium: '⚠️',
        high: '🔶',
        critical: '🔴',
      };
      console.error(
        `${severityEmoji[detectedSeverity]} [ErrorReporter] ${category}:`,
        errorObj.message,
        context
      );
    }

    // Invoke registered callbacks for custom handling (e.g., UI notifications)
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(report);
      } catch (callbackError) {
        // Prevent callback errors from breaking error reporting
        console.error('Error in error callback:', callbackError);
      }
    });

    // In production, could send to external error tracking service
    // Example: Sentry, Rollbar, LogRocket, etc.
    if (import.meta.env.PROD && detectedSeverity === 'critical') {
      // this.sendToExternalService(report);
    }
  }

  /**
   * Report a warning (non-critical error)
   *
   * @param message - Warning message
   * @param category - Warning category
   * @param context - Additional context
   */
  reportWarning(
    message: string,
    category: ErrorCategory = 'unknown',
    context?: ErrorContext
  ): void {
    if (!this.enabled) return;

    eventTracker.trackWarning(message, { category, ...context });

    if (import.meta.env.DEV) {
      console.warn(`⚠️ [ErrorReporter] ${category}: ${message}`, context);
    }
  }

  /**
   * Register a callback to be invoked when errors are reported
   * Useful for showing toast notifications or other UI feedback
   *
   * @param callback - Function to call when errors occur
   * @returns Unsubscribe function
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Enable or disable error reporting
   * @param enabled - Whether to enable reporting
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if error reporting is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Auto-detect error severity based on error type and category
   */
  private detectSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // Critical errors
    if (
      error.name === 'SecurityError' ||
      error.name === 'ReferenceError' ||
      category === 'rendering'
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      error.name === 'TypeError' ||
      category === 'game-logic' ||
      category === 'network'
    ) {
      return 'high';
    }

    // Medium severity errors
    if (category === 'audio' || category === 'performance') {
      return 'medium';
    }

    // Low severity by default
    return 'low';
  }

  /**
   * Send error to external service (placeholder for future implementation)
   * @private
   */
  // private sendToExternalService(report: ErrorReport): void {
  //   // Example integration:
  //   // Sentry.captureException(new Error(report.message), {
  //   //   level: report.severity,
  //   //   tags: { category: report.category },
  //   //   extra: report.context,
  //   // });
  // }
}

// Create and export singleton instance
export const errorReporter = new ErrorReporter();

// Expose to window for debugging in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as Window & { errorReporter?: ErrorReporter }).errorReporter = errorReporter;
}
