import { cn } from "@/lib/utils";
import type { LoadingSkeletonVariantProps } from "./types";

/**
 * Worm loading skeleton used during the gameplay boot sequence.
 */
export const LoadingSkeletonWorm = ({ className }: LoadingSkeletonVariantProps) => (
    <div
        className={cn(
            "h-screen w-screen flex items-center justify-center bg-linear-to-br from-primary/20 to-secondary/20 transition-all duration-500",
            className,
        )}
        role="status"
        aria-live="polite"
        aria-label="Loading game experience"
    >
        <div className="text-center space-y-4">
            <div
                className="text-6xl animate-bounce"
                style={{
                    animation: "bounce 1s ease-in-out infinite",
                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
                }}
            >
                🐛
            </div>

            <div className="relative overflow-hidden">
                <div
                    className="text-xl font-semibold text-primary"
                    style={{
                        background:
                            "linear-gradient(90deg, currentColor 0%, currentColor 40%, transparent 50%, currentColor 60%, currentColor 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 2s ease-in-out infinite",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Loading game...
                </div>
            </div>

            <div className="flex justify-center gap-2 pt-2">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary/60"
                        style={{
                            animation: "pulse 1.5s ease-in-out infinite",
                            animationDelay: `${i * 0.2}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    </div>
);
