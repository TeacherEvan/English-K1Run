/**
 * Tests for global error reporter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorReporter } from '../error-reporter';
import { eventTracker } from '../event-tracker';

// Mock the event tracker
vi.mock('../event-tracker', () => ({
  eventTracker: {
    trackError: vi.fn(),
    trackWarning: vi.fn(),
  },
}));

describe('ErrorReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorReporter.setEnabled(true);
  });

  describe('reportError', () => {
    it('should report an error with correct category and context', () => {
      const testError = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      errorReporter.reportError(testError, 'game-logic', context);

      expect(eventTracker.trackError).toHaveBeenCalledWith(
        testError,
        'game-logic: Test error'
      );
    });

    it('should handle string errors by converting to Error objects', () => {
      const errorMessage = 'String error message';

      errorReporter.reportError(errorMessage, 'audio');

      expect(eventTracker.trackError).toHaveBeenCalled();
      const callArgs = (eventTracker.trackError as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(callArgs[0]).toBeInstanceOf(Error);
      expect(callArgs[0].message).toBe(errorMessage);
    });

    it('should auto-detect severity for critical errors', () => {
      const callback = vi.fn();
      errorReporter.onError(callback);

      const securityError = new Error('Security violation');
      securityError.name = 'SecurityError';

      errorReporter.reportError(securityError, 'unknown');

      expect(callback).toHaveBeenCalled();
      const report = callback.mock.calls[0][0];
      expect(report.severity).toBe('critical');
    });

    it('should auto-detect severity for high-priority errors', () => {
      const callback = vi.fn();
      errorReporter.onError(callback);

      const typeError = new Error('Type error');
      typeError.name = 'TypeError';

      errorReporter.reportError(typeError, 'unknown');

      const report = callback.mock.calls[0][0];
      expect(report.severity).toBe('high');
    });

    it('should auto-detect severity based on category', () => {
      const callback = vi.fn();
      errorReporter.onError(callback);

      errorReporter.reportError(new Error('Audio failed'), 'audio');

      const report = callback.mock.calls[0][0];
      expect(report.severity).toBe('medium');
    });

    it('should use provided severity when specified', () => {
      const callback = vi.fn();
      errorReporter.onError(callback);

      errorReporter.reportError(new Error('Test'), 'unknown', {}, 'critical');

      const report = callback.mock.calls[0][0];
      expect(report.severity).toBe('critical');
    });

    it('should not report errors when disabled', () => {
      errorReporter.setEnabled(false);

      errorReporter.reportError(new Error('Test'), 'unknown');

      expect(eventTracker.trackError).not.toHaveBeenCalled();
    });

    it('should include context in error report', () => {
      const callback = vi.fn();
      errorReporter.onError(callback);

      const context = { levelId: 5, playerCount: 2 };
      errorReporter.reportError(new Error('Game error'), 'game-logic', context);

      const report = callback.mock.calls[0][0];
      expect(report.context).toEqual(context);
    });

    it('should capture stack trace', () => {
      const callback = vi.fn();
      errorReporter.onError(callback);

      const error = new Error('Test error');
      errorReporter.reportError(error, 'unknown');

      const report = callback.mock.calls[0][0];
      expect(report.stack).toBeDefined();
      expect(report.stack).toContain('Test error');
    });
  });

  describe('reportWarning', () => {
    it('should report a warning with correct category', () => {
      const message = 'Warning message';
      const context = { info: 'test' };

      errorReporter.reportWarning(message, 'performance', context);

      expect(eventTracker.trackWarning).toHaveBeenCalledWith(message, {
        category: 'performance',
        info: 'test',
      });
    });

    it('should not report warnings when disabled', () => {
      errorReporter.setEnabled(false);

      errorReporter.reportWarning('Test warning', 'unknown');

      expect(eventTracker.trackWarning).not.toHaveBeenCalled();
    });
  });

  describe('onError callbacks', () => {
    it('should invoke registered callbacks when errors occur', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      errorReporter.onError(callback1);
      errorReporter.onError(callback2);

      errorReporter.reportError(new Error('Test'), 'unknown');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should allow unsubscribing from callbacks', () => {
      const callback = vi.fn();

      const unsubscribe = errorReporter.onError(callback);
      unsubscribe();

      errorReporter.reportError(new Error('Test'), 'unknown');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      errorReporter.onError(errorCallback);
      errorReporter.onError(normalCallback);

      // Should not throw
      expect(() => {
        errorReporter.reportError(new Error('Test'), 'unknown');
      }).not.toThrow();

      // Both callbacks should have been attempted
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('enable/disable', () => {
    it('should be enabled by default', () => {
      expect(errorReporter.isEnabled()).toBe(true);
    });

    it('should allow disabling and re-enabling', () => {
      errorReporter.setEnabled(false);
      expect(errorReporter.isEnabled()).toBe(false);

      errorReporter.setEnabled(true);
      expect(errorReporter.isEnabled()).toBe(true);
    });
  });

  describe('error report structure', () => {
    it('should create complete error reports', () => {
      const callback = vi.fn();
      errorReporter.onError(callback);

      const error = new Error('Complete test');
      error.name = 'TestError';
      const context = { key: 'value' };

      errorReporter.reportError(error, 'game-logic', context, 'high');

      const report = callback.mock.calls[0][0];

      expect(report).toMatchObject({
        message: 'Complete test',
        category: 'game-logic',
        severity: 'high',
        name: 'TestError',
        context: { key: 'value' },
      });
      expect(report.timestamp).toBeDefined();
      expect(report.stack).toBeDefined();
    });
  });
});
