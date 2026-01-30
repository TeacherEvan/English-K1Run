import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import type { TooltipContent } from "@/components/ui/tooltip";

import type { sidebarMenuButtonVariants } from "../sidebar-variants";

/**
 * Props for SidebarMenuButton component
 */
export interface SidebarMenuButtonProps
  extends
    ComponentProps<"button">,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | ComponentProps<typeof TooltipContent>;
}

/**
 * Props for SidebarMenuAction component
 */
export interface SidebarMenuActionProps extends ComponentProps<"button"> {
  asChild?: boolean;
  showOnHover?: boolean;
}

/**
 * Props for SidebarMenuSkeleton component
 */
export interface SidebarMenuSkeletonProps extends ComponentProps<"div"> {
  showIcon?: boolean;
}

/**
 * Props for SidebarMenuSubButton component
 */
export interface SidebarMenuSubButtonProps extends ComponentProps<"a"> {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}
