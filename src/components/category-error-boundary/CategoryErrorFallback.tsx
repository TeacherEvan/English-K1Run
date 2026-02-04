import type { ErrorInfo } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { getCategoryConfig } from "./category-config";
import type { ErrorCategory } from "./types";

interface CategoryErrorFallbackProps {
    error: Error;
    errorInfo: ErrorInfo | null;
    category: ErrorCategory;
    recoveryAttempts: number;
    safeMode: boolean;
    enableSafeMode?: boolean;
    onReset: () => void;
    onSafeMode: () => void;
    onReload: () => void;
}

/**
 * Visual fallback UI for category error boundaries.
 */
export const CategoryErrorFallback = ({
    error,
    errorInfo,
    category,
    recoveryAttempts,
    safeMode,
    enableSafeMode,
    onReset,
    onSafeMode,
    onReload,
}: CategoryErrorFallbackProps) => {
    const config = getCategoryConfig(category);
    const showSafeMode = enableSafeMode && recoveryAttempts >= 2;

    if (safeMode) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-yellow-500/10 via-background to-yellow-500/5 p-4">
                <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-yellow-500/20">
                    <div className="mb-6 flex justify-center">
                        <div className="text-8xl">🛡️</div>
                    </div>
                    <h1 className="text-3xl font-bold text-yellow-600 mb-4">
                        Safe Mode Activated
                    </h1>
                    <p className="text-lg text-muted-foreground mb-6">
                        Running with reduced features to prevent further errors. Some
                        animations and sounds may be disabled.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={onReset} size="lg">
                            Continue in Safe Mode
                        </Button>
                        <Button onClick={onReload} variant="outline" size="lg">
                            Reload Normally
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-destructive/10 via-background to-destructive/5 p-4">
            <Card className="max-w-2xl w-full p-8 text-center shadow-2xl border-destructive/20">
                <div className="mb-6 flex justify-center">
                    <div className="text-8xl animate-pulse">{config.emoji}</div>
                </div>

                <h1 className="text-3xl font-bold text-destructive mb-4">
                    {config.title}
                </h1>

                <p className="text-lg text-muted-foreground mb-6">{config.message}</p>

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

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                    <Button onClick={onReset} size="lg" className="flex-1 sm:flex-initial">
                        🔄 {config.primaryAction}
                    </Button>
                    {showSafeMode && (
                        <Button
                            onClick={onSafeMode}
                            variant="outline"
                            size="lg"
                            className="flex-1 sm:flex-initial"
                        >
                            🛡️ {config.secondaryAction}
                        </Button>
                    )}
                    <Button
                        onClick={onReload}
                        variant="outline"
                        size="lg"
                        className="flex-1 sm:flex-initial"
                    >
                        ↻ Reload Page
                    </Button>
                </div>

                {recoveryAttempts > 1 && (
                    <p className="text-sm text-yellow-600 mb-4">
                        ⚠️ Multiple recovery attempts detected. Safe mode will activate on
                        next error.
                    </p>
                )}

                {import.meta.env.DEV && (
                    <details className="mt-8 text-left">
                        <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
                            🔧 Developer Details (Category: {category})
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

                            <div className="text-xs text-muted-foreground">
                                Recovery Attempts: {recoveryAttempts} | Safe Mode: {safeMode ? "Active" : "Inactive"}
                            </div>
                        </div>
                    </details>
                )}
            </Card>
        </div>
    );
};
