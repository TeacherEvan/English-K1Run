import { cn } from "@/lib/utils";
import type { LoadingSkeletonVariantProps } from "./types";

/**
 * Default shimmer skeleton used by secondary loading surfaces.
 */
export const LoadingSkeletonDefault = ({ className }: LoadingSkeletonVariantProps) => (
    <div
        className={cn("bg-muted rounded-lg relative overflow-hidden", className)}
        role="status"
        aria-label="Loading content"
    >
        <div className="h-full w-full animate-pulse" />
        <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
            style={{
                animation: "shimmerSlide 2s ease-in-out infinite",
                transform: "translateX(-100%)",
            }}
        />
    </div>
);
