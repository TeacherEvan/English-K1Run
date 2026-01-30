import type { ComponentProps } from "react";
import { useMemo } from "react";

import type { TooltipContent } from "@/components/ui/tooltip";

/**
 * Normalizes tooltip prop to TooltipContent props format
 * @param tooltip - String or TooltipContent props
 * @returns TooltipContent props object
 */
export function normalizeTooltipProp(
  tooltip: string | ComponentProps<typeof TooltipContent>,
): ComponentProps<typeof TooltipContent> {
  if (typeof tooltip === "string") {
    return {
      children: tooltip,
    };
  }
  return tooltip;
}

/**
 * Hook to generate stable skeleton width to avoid hydration issues
 * Uses fixed width instead of Math.random() to ensure consistency
 * @returns Stable width string
 */
export function useStableSkeletonWidth(): string {
  return useMemo(() => {
    // Use a stable seed based on component position or provide a fixed width
    return "70%"; // Fixed width to avoid Math.random() during render
  }, []);
}

/**
 * Class name utilities for menu components
 */
export const menuClassNames = {
  menu: "flex w-full min-w-0 flex-col gap-1",
  menuItem: "group/menu-item relative",
  menuAction:
    "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
  menuActionAfter: "after:absolute after:-inset-2 md:after:hidden",
  menuBadge:
    "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
  menuSub:
    "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
  menuSubItem: "group/menu-sub-item relative",
  menuSubButton:
    "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
} as const;
