import { cn } from "@/lib/utils";
import type { LoadingSkeletonVariantProps } from "./types";

export type LoadingSkeletonOverlayVariant = "fireworks" | "achievement" | "menu";

/**
 * Overlay skeleton variants that render on top of existing UI.
 */
export const LoadingSkeletonOverlays = ({
    variant,
    className,
}: LoadingSkeletonVariantProps & { variant: LoadingSkeletonOverlayVariant }) => {
    if (variant === "fireworks") {
        return (
            <div
                className={cn(
                    "absolute inset-0 flex items-center justify-center pointer-events-none",
                    className,
                )}
                role="presentation"
                aria-hidden="true"
            >
                <div
                    className="text-8xl"
                    style={{
                        animation: "pulse 1s ease-in-out infinite, scale 2s ease-in-out infinite",
                        filter: "drop-shadow(0 8px 24px rgba(255,215,0,0.4))",
                    }}
                >
                    🎆
                </div>
            </div>
        );
    }

    if (variant === "achievement") {
        return (
            <div
                className={cn("absolute top-28 left-1/2 -translate-x-1/2 z-40", className)}
                role="status"
                aria-live="polite"
            >
                <div
                    className="w-64 h-20 rounded-2xl bg-linear-to-br from-primary/40 to-secondary/40 relative overflow-hidden"
                    style={{
                        animation: "pulse 1.5s ease-in-out infinite",
                    }}
                >
                    <div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                        style={{
                            animation: "shimmerSlide 2s ease-in-out infinite",
                            transform: "translateX(-100%)",
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50",
                className,
            )}
            role="status"
            aria-live="polite"
            aria-label="Loading menu"
            data-testid="game-menu"
        >
            <div className="text-center space-y-4">
                <div
                    className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
                    style={{
                        animation: "spin 1s linear infinite",
                    }}
                />
                <div className="text-white/80 text-lg font-medium">Loading...</div>
            </div>
        </div>
    );
};
