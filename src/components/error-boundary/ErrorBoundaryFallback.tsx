import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ErrorInfo } from "react";

interface ErrorBoundaryFallbackProps {
    error: Error;
    errorInfo: ErrorInfo | null;
    onReset: () => void;
    onReload: () => void;
}

/**
 * Default ErrorBoundary fallback UI with optional developer details.
 */
export const ErrorBoundaryFallback = ({
    error,
    errorInfo,
    onReset,
    onReload,
}: ErrorBoundaryFallbackProps) => (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
        <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-destructive/20">
            <div className="mb-6 flex justify-center">
                <div className="text-8xl animate-pulse">😔</div>
            </div>

            <h1 className="text-3xl font-bold text-destructive mb-4">
                Oops! Something went wrong
            </h1>

            <p className="text-lg text-muted-foreground mb-6">
                Don't worry, this happens sometimes. We've logged the error and our team will look into it.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Button onClick={onReset} size="lg" className="flex-1 sm:flex-initial">
                    🔄 Try Again
                </Button>
                <Button
                    onClick={onReload}
                    variant="outline"
                    size="lg"
                    className="flex-1 sm:flex-initial"
                >
                    ↻ Reload Page
                </Button>
            </div>

            {import.meta.env.DEV && (
                <details className="mt-8 text-left">
                    <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
                        🔧 Developer Details (click to expand)
                    </summary>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-destructive mb-2">
                                Error: {error.name}
                            </h3>
                            <p className="text-xs font-mono bg-background p-3 rounded border border-border overflow-auto">
                                {error.message}
                            </p>
                        </div>

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

            {!import.meta.env.DEV && (
                <p className="mt-6 text-sm text-muted-foreground">
                    If this problem persists, please contact support with the time this error occurred: <br />
                    <span className="font-mono font-semibold">{new Date().toLocaleString()}</span>
                </p>
            )}
        </Card>
    </div>
);
