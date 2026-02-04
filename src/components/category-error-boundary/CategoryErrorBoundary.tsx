import { Component, type ErrorInfo } from "react";
import { CategoryErrorFallback } from "./CategoryErrorFallback";
import type { CategoryErrorBoundaryProps, ErrorCategory } from "./types";

interface CategoryErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    safeMode: boolean;
    recoveryAttempts: number;
}

/**
 * CategoryErrorBoundary - Specialized error boundaries for different app sections.
 */
export class CategoryErrorBoundary extends Component<
    CategoryErrorBoundaryProps,
    CategoryErrorBoundaryState
> {
    private maxRecoveryAttempts = 3;

    constructor(props: CategoryErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            safeMode: false,
            recoveryAttempts: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<CategoryErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        const { category, onError } = this.props;
        const { recoveryAttempts } = this.state;

        if (import.meta.env.DEV) {
            console.error(
                `[${category.toUpperCase()}] ErrorBoundary caught an error:`,
                error,
                errorInfo,
            );
        }

        this.setState({
            errorInfo,
            recoveryAttempts: recoveryAttempts + 1,
            safeMode:
                recoveryAttempts >= this.maxRecoveryAttempts - 1 ||
                category === "performance" ||
                category === "rendering",
        });

        onError?.(error, errorInfo, category);
        this.reportError(error, errorInfo, category);
    }

    private reportError = (
        error: Error,
        errorInfo: ErrorInfo,
        category: ErrorCategory,
    ): void => {
        const errorReport = {
            category,
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            recoveryAttempts: this.state.recoveryAttempts,
        };

        if (!import.meta.env.DEV) {
            console.log("Error reported:", errorReport);
        }
    };

    private handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    private handleSafeMode = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            safeMode: true,
        });
    };

    private handleReload = (): void => {
        window.location.reload();
    };

    render() {
        const { hasError, error, errorInfo, safeMode, recoveryAttempts } =
            this.state;
        const { children, fallback, category, enableSafeMode } = this.props;

        if (hasError && error) {
            if (fallback) {
                return fallback(error, errorInfo!, this.handleReset, category);
            }

            return (
                <CategoryErrorFallback
                    error={error}
                    errorInfo={errorInfo}
                    category={category}
                    recoveryAttempts={recoveryAttempts}
                    safeMode={safeMode}
                    enableSafeMode={enableSafeMode}
                    onReset={this.handleReset}
                    onSafeMode={this.handleSafeMode}
                    onReload={this.handleReload}
                />
            );
        }

        return children;
    }
}
