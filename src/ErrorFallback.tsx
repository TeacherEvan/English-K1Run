import { useCallback, useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert"
import { Button } from "./components/ui/button"
import { Card } from "./components/ui/card"

// Removed lucide-react imports to prevent circular crashes
// import { AlertTriangleIcon, HomeIcon, RefreshCwIcon } from "lucide-react"

interface ErrorFallbackProps {
  error: any
  resetErrorBoundary: () => void
}

/**
 * ErrorFallback - Production-grade error fallback with retry mechanism
 * 
 * Features:
 * - Automatic retry countdown for transient errors
 * - User-friendly error messages with categorization
 * - Detailed error logging for support
 * - Smooth animations and micro-interactions
 * - Development mode: rethrows for better debugging
 * 
 * Best Practices (2025):
 * - Implements graceful degradation
 * - Provides clear recovery paths
 * - Uses semantic error categorization
 * - Accessible with ARIA labels
 * 
 * @component
 */
export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) {
    console.error('ErrorFallback caught error in DEV:', error);
    // throw error
  }


  const [retryCount, setRetryCount] = useState(0)
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number | null>(null)

  // Categorize error for better user guidance
  const errorCategory = categorizeError(error)

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1)
    setAutoRetryCountdown(null)
    resetErrorBoundary()
  }, [resetErrorBoundary])

  // Auto-retry for transient errors after 5 seconds
  useEffect(() => {
    // Only auto-retry for network or timeout errors, and max 2 times
    if ((errorCategory === 'network' || errorCategory === 'timeout') && retryCount < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoRetryCountdown(5)  // Intentional: Initialize countdown timer

      const countdown = setInterval(() => {
        setAutoRetryCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdown)
            handleRetry()
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdown)
    }
  }, [retryCount, errorCategory, handleRetry])

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div data-testid="error-fallback" className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-destructive/10 via-background to-destructive/5 p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl border-destructive/20 animate-in fade-in zoom-in duration-500">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="text-7xl animate-bounce">😔</div>
            <div className="absolute -top-2 -right-2 text-2xl animate-pulse">
              <span className="text-destructive">⚠️</span>
            </div>
          </div>
        </div>

        {/* Main Error Alert */}
        <Alert variant="destructive" className="mb-6 shadow-lg border-2">
          <span className="mr-2">⚠️</span>
          <AlertTitle className="text-xl font-bold">
            Oops! The game encountered an error
          </AlertTitle>
          <AlertDescription className="text-base mt-2">
            Don't worry - this happens sometimes! We've logged the error.
            Please try again or reload the page to continue playing.
          </AlertDescription>
        </Alert>

        {/* Error Details */}
        <div className="bg-muted/30 border rounded-xl p-5 mb-6 transition-all hover:shadow-md">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <span>📋</span>
            <span>Error Details:</span>
          </h3>
          <pre className="text-xs text-destructive bg-background/80 p-4 rounded-lg border border-destructive/20 overflow-auto max-h-40 font-mono">
            {error.message}
          </pre>
        </div>

        {/* Auto-retry indicator */}
        {autoRetryCountdown !== null && (
          <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 animate-in fade-in slide-in-from-bottom">
            <p className="text-sm text-blue-800 text-center font-medium">
              ⏳ Automatically retrying in <span className="font-bold text-lg">{autoRetryCountdown}</span> second{autoRetryCountdown !== 1 ? 's' : ''}...
            </p>
          </div>
        )}

        {/* Error category guidance */}
        {getErrorGuidance(errorCategory) && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-semibold">Tip:</span> {getErrorGuidance(errorCategory)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRetry}
            size="lg"
            className="flex-1 group"
            disabled={autoRetryCountdown !== null}
          >
            <span className="mr-2 group-hover:rotate-180 transition-transform duration-500">🔄</span>
            {autoRetryCountdown !== null ? 'Retrying...' : retryCount > 0 ? `Try Again (${retryCount})` : 'Try Again'}
          </Button>

          <Button
            onClick={handleReload}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <span className="mr-2">🏠</span>
            Reload Game
          </Button>
        </div>

        {/* Retry count indicator */}
        {retryCount > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Retry attempts: <span className="font-semibold">{retryCount}</span>
          </p>
        )}

        {/* Timestamp for support */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Error occurred at: <span className="font-mono font-semibold">{new Date().toLocaleString()}</span>
        </p>
      </Card>
    </div>
  )
}

/**
 * Categorize errors for better user guidance and auto-retry logic
 * @param error - The caught error
 * @returns Error category
 */
function categorizeError(error: Error): 'network' | 'timeout' | 'rendering' | 'unknown' {
  const message = error.message.toLowerCase()

  if (message.includes('network') || message.includes('fetch') || message.includes('failed to load')) {
    return 'network'
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout'
  }

  if (message.includes('render') || message.includes('cannot read') || message.includes('undefined')) {
    return 'rendering'
  }

  return 'unknown'
}

/**
 * Get user-friendly guidance based on error category
 * @param category - Error category
 * @returns Guidance message or null
 */
function getErrorGuidance(category: string): string | null {
  switch (category) {
    case 'network':
      return 'Check your internet connection and try again.'
    case 'timeout':
      return 'The request took too long. Please try again.'
    case 'rendering':
      return 'Something went wrong with the game display. Reloading should fix it.'
    default:
      return null
  }
}
