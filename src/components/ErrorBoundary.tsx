import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Optional custom fallback component */
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean
  /** The caught error */
  error: Error | null
  /** Additional error information */
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary - Production-grade error boundary component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs errors, and displays a beautiful fallback UI.
 * 
 * Features:
 * - Beautiful, user-friendly error display
 * - Detailed error information (dev mode only)
 * - One-click error recovery
 * - Error logging callback support
 * - Custom fallback UI support
 * 
 * @component
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error, info) => logToService(error, info)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  /**
   * Resets the error boundary state, attempting to recover
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  /**
   * Reloads the entire page (nuclear option)
   */
  private handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.handleReset)
      }

      // Default beautiful error UI
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
          <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-destructive/20">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="text-8xl animate-pulse">😔</div>
            </div>

            {/* Error Heading */}
            <h1 className="text-3xl font-bold text-destructive mb-4">
              Oops! Something went wrong
            </h1>

            {/* User-friendly message */}
            <p className="text-lg text-muted-foreground mb-6">
              Don't worry, this happens sometimes. We've logged the error and our team will look into it.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                onClick={this.handleReset}
                size="lg"
                className="flex-1 sm:flex-initial"
              >
                🔄 Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-initial"
              >
                ↻ Reload Page
              </Button>
            </div>

            {/* Developer Details (dev mode only) */}
            {import.meta.env.DEV && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
                  🔧 Developer Details (click to expand)
                </summary>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  {/* Error Name & Message */}
                  <div>
                    <h3 className="text-sm font-semibold text-destructive mb-2">
                      Error: {error.name}
                    </h3>
                    <p className="text-xs font-mono bg-background p-3 rounded border border-border overflow-auto">
                      {error.message}
                    </p>
                  </div>

                  {/* Stack Trace */}
                  {error.stack && (
                    <div>
                      <h3 className="text-sm font-semibold text-destructive mb-2">
                        Stack Trace:
                      </h3>
                      <pre className="text-xs font-mono bg-background p-3 rounded border border-border overflow-auto max-h-64">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Stack */}
                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="text-sm font-semibold text-destructive mb-2">
                        Component Stack:
                      </h3>
                      <pre className="text-xs font-mono bg-background p-3 rounded border border-border overflow-auto max-h-64">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Production-friendly help text */}
            {!import.meta.env.DEV && (
              <p className="mt-6 text-sm text-muted-foreground">
                If this problem persists, please contact support with the time this error occurred: <br />
                <span className="font-mono font-semibold">
                  {new Date().toLocaleString()}
                </span>
              </p>
            )}
          </Card>
        </div>
      )
    }

    return children
  }
}
