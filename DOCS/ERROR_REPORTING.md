# Global Error Reporting System

## Overview

A centralized error reporting system that integrates with the existing EventTracker and provides a consistent API for error reporting across the application.

## Features

- ✅ **Centralized Error Tracking**: Single point of entry for all application errors
- ✅ **Category-Based Classification**: Errors are categorized for better organization
- ✅ **Auto-Severity Detection**: Automatically determines error severity based on type and category
- ✅ **EventTracker Integration**: Seamlessly integrates with existing event tracking infrastructure
- ✅ **Extensible Callbacks**: Support for custom error handling (e.g., toast notifications)
- ✅ **Production Ready**: Hooks for external error tracking services (Sentry, Rollbar, etc.)
- ✅ **Development Friendly**: Enhanced logging in development mode

## Usage

### Basic Error Reporting

```typescript
import { errorReporter } from '@/lib/error-reporter'

try {
  // risky operation
  startGame(levelId)
} catch (error) {
  errorReporter.reportError(
    error instanceof Error ? error : new Error(String(error)),
    'game-logic',
    { levelId }
  )
}
```

### Warning Reporting

```typescript
import { errorReporter } from '@/lib/error-reporter'

if (audioLoadingTime > 1000) {
  errorReporter.reportWarning(
    'Audio loading took longer than expected',
    'audio',
    { loadingTime: audioLoadingTime }
  )
}
```

### Custom Error Handlers

```typescript
import { errorReporter } from '@/lib/error-reporter'

// Register a callback for showing user-facing notifications
const unsubscribe = errorReporter.onError((report) => {
  if (report.severity === 'critical') {
    showToast({
      title: 'Critical Error',
      description: 'Something went wrong. Please refresh the page.',
      variant: 'destructive'
    })
  }
})

// Later, when component unmounts:
unsubscribe()
```

## Error Categories

The following categories are supported:

- **`game-logic`**: Errors in game mechanics and state management
- **`audio`**: Audio loading and playback errors
- **`rendering`**: Display and graphics errors
- **`network`**: Connection and API errors
- **`performance`**: Performance-related issues
- **`settings`**: User settings and preferences errors
- **`user-action`**: User interaction errors
- **`unknown`**: Uncategorized errors

## Severity Levels

Errors are automatically assigned severity levels:

- **`critical`**: SecurityError, ReferenceError, rendering issues
- **`high`**: TypeError, game-logic errors, network errors
- **`medium`**: Audio and performance issues
- **`low`**: Default for other errors

You can also manually specify severity:

```typescript
errorReporter.reportError(
  new Error('Manual critical error'),
  'game-logic',
  { context: 'data' },
  'critical' // Manual severity override
)
```

## Integration with External Services

To integrate with external error tracking services (e.g., Sentry), uncomment and implement the `sendToExternalService` method in `src/lib/error-reporter.ts`:

```typescript
private sendToExternalService(report: ErrorReport): void {
  // Example integration with Sentry:
  Sentry.captureException(new Error(report.message), {
    level: report.severity,
    tags: { category: report.category },
    extra: report.context,
  });
}
```

## Testing

Comprehensive unit tests are available in `src/lib/__tests__/error-reporter.test.ts`.

Run tests with:
```bash
npm run test:run -- src/lib/__tests__/error-reporter.test.ts
```

## API Reference

### `errorReporter.reportError(error, category, context?, severity?)`

Report an error to the global tracking system.

**Parameters:**
- `error`: Error object or string message
- `category`: Error category for classification
- `context?`: Additional context information (optional)
- `severity?`: Manual severity override (optional)

### `errorReporter.reportWarning(message, category, context?)`

Report a non-critical warning.

**Parameters:**
- `message`: Warning message
- `category`: Warning category
- `context?`: Additional context information (optional)

### `errorReporter.onError(callback)`

Register a callback to be invoked when errors are reported.

**Parameters:**
- `callback`: Function to call when errors occur

**Returns:** Unsubscribe function

### `errorReporter.setEnabled(enabled)`

Enable or disable error reporting.

**Parameters:**
- `enabled`: Whether to enable reporting

### `errorReporter.isEnabled()`

Check if error reporting is enabled.

**Returns:** `boolean`
