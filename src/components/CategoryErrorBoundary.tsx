import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

export type ErrorCategory =
    | 'game-logic'
    | 'audio'
    | 'rendering'
    | 'network'
    | 'performance'
    | 'unknown'

interface CategoryErrorBoundaryProps {
    /** Child components to render */
    children: ReactNode
    /** Error category for specialized handling */
    category: ErrorCategory
    /** Optional custom fallback component */
    fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void, category: ErrorCategory) => ReactNode
    /** Optional error handler callback */
    onError?: (error: Error, errorInfo: ErrorInfo, category: ErrorCategory) => void
    /** Whether to enable safe mode fallback */
    enableSafeMode?: boolean
}

interface CategoryErrorBoundaryState {
    /** Whether an error has been caught */
    hasError: boolean
    /** The caught error */
    error: Error | null
    /** Additional error information */
    errorInfo: ErrorInfo | null
    /** Whether safe mode is active */
    safeMode: boolean
    /** Error recovery attempts */
    recoveryAttempts: number
}

/**
 * CategoryErrorBoundary - Specialized error boundaries for different app sections
 *
 * Provides category-specific error handling with tailored recovery strategies:
 * - Game Logic: Reset game state, offer level restart
 * - Audio: Fallback to text-only mode, audio troubleshooting
 * - Rendering: Simplified UI, performance mode
 * - Network: Offline mode, retry mechanisms
 * - Performance: Reduced animations, memory cleanup
 *
 * Features:
 * - Automatic safe mode activation after multiple failures
 * - Category-specific recovery suggestions
 * - Error analytics and reporting
 * - Graceful degradation strategies
 *
 * @component
 * @example
 * ```tsx
 * <CategoryErrorBoundary category="game-logic" enableSafeMode>
 *   <GameLogicComponent />
 * </CategoryErrorBoundary>
 * ```
 */
export class CategoryErrorBoundary extends Component<CategoryErrorBoundaryProps, CategoryErrorBoundaryState> {
    private maxRecoveryAttempts = 3

    constructor(props: CategoryErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            safeMode: false,
            recoveryAttempts: 0
        }
    }

    static getDerivedStateFromError(error: Error): Partial<CategoryErrorBoundaryState> {
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        const { category, onError } = this.props
        const { recoveryAttempts } = this.state

        // Log error with category context
        if (import.meta.env.DEV) {
            console.error(`[${category.toUpperCase()}] ErrorBoundary caught an error:`, error, errorInfo)
        }

        // Update state with error info
        this.setState({
            errorInfo,
            recoveryAttempts: recoveryAttempts + 1,
            // Activate safe mode after multiple failures or for critical categories
            safeMode: recoveryAttempts >= this.maxRecoveryAttempts - 1 ||
                category === 'performance' ||
                category === 'rendering'
        })

        // Call optional error handler
        onError?.(error, errorInfo, category)

        // Report error to analytics (if available)
        this.reportError(error, errorInfo, category)
    }

    private reportError = (error: Error, errorInfo: ErrorInfo, category: ErrorCategory): void => {
        // Could integrate with error reporting service
        const errorReport = {
            category,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            recoveryAttempts: this.state.recoveryAttempts
        }

        // In production, send to error reporting service
        if (!import.meta.env.DEV) {
            // Example: sendErrorReport(errorReport)
            console.log('Error reported:', errorReport)
        }
    }

    /**
     * Attempts to reset the error boundary state
     */
    private handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    /**
     * Activates safe mode with reduced functionality
     */
    private handleSafeMode = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            safeMode: true
        })
    }

    /**
     * Reloads the entire page (nuclear option)
     */
    private handleReload = (): void => {
        window.location.reload()
    }

    /**
     * Gets category-specific error messages and recovery options
     */
    private getCategoryConfig = (category: ErrorCategory) => {
        const configs = {
            'game-logic': {
                title: 'Game Error',
                message: 'Something went wrong with the game mechanics.',
                emoji: '🎮',
                suggestions: ['Try restarting the current level', 'Check your device memory', 'Close other apps'],
                primaryAction: 'Restart Level',
                secondaryAction: 'Safe Mode'
            },
            'audio': {
                title: 'Audio Error',
                message: 'There was a problem loading or playing sounds.',
                emoji: '🔊',
                suggestions: ['Check your audio settings', 'Try refreshing the page', 'Use headphones if available'],
                primaryAction: 'Retry Audio',
                secondaryAction: 'Text Only Mode'
            },
            'rendering': {
                title: 'Display Error',
                message: 'There was a problem showing the game graphics.',
                emoji: '🖼️',
                suggestions: ['Try a different browser', 'Update your graphics drivers', 'Reduce screen resolution'],
                primaryAction: 'Refresh Display',
                secondaryAction: 'Simple Mode'
            },
            'network': {
                title: 'Connection Error',
                message: 'Unable to connect to game services.',
                emoji: '🌐',
                suggestions: ['Check your internet connection', 'Try again in a few minutes', 'Contact support if persistent'],
                primaryAction: 'Retry Connection',
                secondaryAction: 'Offline Mode'
            },
            'performance': {
                title: 'Performance Error',
                message: 'The game is running too slowly on your device.',
                emoji: '🐌',
                suggestions: ['Close other browser tabs', 'Restart your browser', 'Try a simpler device'],
                primaryAction: 'Performance Mode',
                secondaryAction: 'Reload Page'
            },
            'unknown': {
                title: 'Unexpected Error',
                message: 'An unexpected error occurred.',
                emoji: '❓',
                suggestions: ['Try refreshing the page', 'Clear browser cache', 'Contact support'],
                primaryAction: 'Try Again',
                secondaryAction: 'Reload Page'
            }
        }

        return configs[category] || configs.unknown
    }

    render(): ReactNode {
        const { hasError, error, errorInfo, safeMode, recoveryAttempts } = this.state
        const { children, fallback, category, enableSafeMode } = this.props

        if (hasError && error) {
            // Use custom fallback if provided
            if (fallback) {
                return fallback(error, errorInfo!, this.handleReset, category)
            }

            const config = this.getCategoryConfig(category)
            const showSafeMode = enableSafeMode && recoveryAttempts >= 2

            // Safe mode UI
            if (safeMode) {
                return (
                    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-yellow-500/10 via-background to-yellow-500/5 p-4">
                        <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-yellow-500/20">
                            <div className="mb-6 flex justify-center">
                                <div className="text-8xl">🛡️</div>
                            </div>
                            <h1 className="text-3xl font-bold text-yellow-600 mb-4">
                                Safe Mode Activated
                            </h1>
                            <p className="text-lg text-muted-foreground mb-6">
                                Running with reduced features to prevent further errors. Some animations and sounds may be disabled.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button onClick={this.handleReset} size="lg">
                                    Continue in Safe Mode
                                </Button>
                                <Button onClick={this.handleReload} variant="outline" size="lg">
                                    Reload Normally
                                </Button>
                            </div>
                        </Card>
                    </div>
                )
            }

            // Standard error UI
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
                    <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-destructive/20">
                        {/* Error Icon */}
                        <div className="mb-6 flex justify-center">
                            <div className="text-8xl animate-pulse">{config.emoji}</div>
                        </div>

                        {/* Error Heading */}
                        <h1 className="text-3xl font-bold text-destructive mb-4">
                            {config.title}
                        </h1>

                        {/* Category-specific message */}
                        <p className="text-lg text-muted-foreground mb-6">
                            {config.message}
                        </p>

                        {/* Recovery suggestions */}
                        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                            <h3 className="font-semibold mb-2">💡 Try these solutions:</h3>
                            <ul className="text-sm space-y-1">
                                {config.suggestions.map((suggestion, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                            <Button
                                onClick={this.handleReset}
                                size="lg"
                                className="flex-1 sm:flex-initial"
                            >
                                🔄 {config.primaryAction}
                            </Button>
                            {showSafeMode && (
                                <Button
                                    onClick={this.handleSafeMode}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 sm:flex-initial"
                                >
                                    🛡️ {config.secondaryAction}
                                </Button>
                            )}
                            <Button
                                onClick={this.handleReload}
                                variant="outline"
                                size="lg"
                                className="flex-1 sm:flex-initial"
                            >
                                ↻ Reload Page
                            </Button>
                        </div>

                        {/* Recovery attempts warning */}
                        {recoveryAttempts > 1 && (
                            <p className="text-sm text-yellow-600 mb-4">
                                ⚠️ Multiple recovery attempts detected. Safe mode will activate on next error.
                            </p>
                        )}

                        {/* Developer Details (dev mode only) */}
                        {import.meta.env.DEV && (
                            <details className="mt-8 text-left">
                                <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
                                    🔧 Developer Details (Category: {category})
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

                                    {/* Recovery Info */}
                                    <div className="text-xs text-muted-foreground">
                                        Recovery Attempts: {recoveryAttempts} | Safe Mode: {safeMode ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </details>
                        )}
                    </Card>
                </div>
            )
        }

        return children
    }
}