import { cn } from "@/lib/utils";
import type { LoadingSkeletonVariantProps } from "./types";

/**
 * Full-screen welcome loading skeleton for the intro flow.
 */
export const LoadingSkeletonWelcome = ({ className }: LoadingSkeletonVariantProps) => (
    <div
        className={cn(
            "h-screen w-screen flex items-center justify-center bg-linear-to-br from-blue-900/80 to-purple-900/80",
            className,
        )}
        role="status"
        aria-live="polite"
        aria-label="Loading welcome screen"
    >
        <div className="text-center space-y-6">
            <div
                className="text-7xl"
                style={{
                    animation: "pulse 2s ease-in-out infinite",
                    filter: "drop-shadow(0 4px 20px rgba(255,255,255,0.3))",
                }}
            >
                🎓
            </div>
            <div
                className="text-2xl font-semibold text-white/90"
                style={{
                    animation: "pulse 2s ease-in-out infinite",
                    animationDelay: "0.3s",
                }}
            >
                Welcome...
            </div>
        </div>
    </div>
);
