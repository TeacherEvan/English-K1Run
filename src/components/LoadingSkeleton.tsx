import { memo } from "react";
import { LoadingSkeletonDefault } from "./loading-skeleton/LoadingSkeletonDefault";
import {
  LoadingSkeletonOverlays,
  type LoadingSkeletonOverlayVariant,
} from "./loading-skeleton/LoadingSkeletonOverlays";
import { LoadingSkeletonWelcome } from "./loading-skeleton/LoadingSkeletonWelcome";
import { LoadingSkeletonWorm } from "./loading-skeleton/LoadingSkeletonWorm";

interface LoadingSkeletonProps {
  /** Variant of the loading skeleton */
  variant?: "default" | "worm" | "fireworks" | "achievement" | "welcome" | "menu";
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingSkeleton - Production-grade loading state component
 * 
 * Provides engaging loading states with shimmer effects and micro-animations
 * following 2025 UX best practices for optimal perceived performance.
 * 
 * Features:
 * - Shimmer animations for premium feel
 * - Spring-based bounce animations
 * - Optimized for 60fps with transform/opacity
 * - Accessible loading indicators
 * 
 * @component
 * @example
 * <Suspense fallback={<LoadingSkeleton variant="worm" />}>
 *   <WormLoadingScreen />
 * </Suspense>
 */
export const LoadingSkeleton = memo(
  ({ variant = "default", className }: LoadingSkeletonProps) => {
    if (variant === "worm") {
      return <LoadingSkeletonWorm className={className} />;
    }

    if (variant === "welcome") {
      return <LoadingSkeletonWelcome className={className} />;
    }

    if (variant === "default") {
      return <LoadingSkeletonDefault className={className} />;
    }

    const overlayVariant: LoadingSkeletonOverlayVariant = variant;
    return (
      <LoadingSkeletonOverlays
        variant={overlayVariant}
        className={className}
      />
    );
  },
);

LoadingSkeleton.displayName = "LoadingSkeleton";