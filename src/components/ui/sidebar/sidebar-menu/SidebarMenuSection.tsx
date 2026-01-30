"use client";

import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps, CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useStableSkeletonWidth } from "./sidebar-menu-utils";
import type { SidebarMenuSkeletonProps, SidebarMenuSubButtonProps } from "./types";

/**
 * SidebarMenuSub - Container for sub-menu items
 * Hidden when sidebar is in icon-only mode
 */
export function SidebarMenuSub({ className, ...props }: ComponentProps<"ul">) {
    return (
        <ul
            data-slot="sidebar-menu-sub"
            data-sidebar="menu-sub"
            className={cn(
                "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    );
}

/**
 * SidebarMenuSubItem - Individual item in a sub-menu
 * Wrapper for sub-menu buttons
 */
export function SidebarMenuSubItem({ className, ...props }: ComponentProps<"li">) {
    return (
        <li
            data-slot="sidebar-menu-sub-item"
            data-sidebar="menu-sub-item"
            className={cn("group/menu-sub-item relative", className)}
            {...props}
        />
    );
}

/**
 * SidebarMenuSubButton - Button component for sub-menu items
 * Supports two sizes (sm, md) and active state
 */
export function SidebarMenuSubButton({
    asChild = false,
    size = "md",
    isActive = false,
    className,
    ...props
}: SidebarMenuSubButtonProps) {
    const Comp = asChild ? Slot : "a";

    return (
        <Comp
            data-slot="sidebar-menu-sub-button"
            data-sidebar="menu-sub-button"
            data-size={size}
            data-active={isActive}
            className={cn(
                "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    );
}

/**
 * SidebarMenuSkeleton - Loading skeleton for menu items
 * Shows optional icon and text placeholder with stable width
 */
export function SidebarMenuSkeleton({
    className,
    showIcon = false,
    ...props
}: SidebarMenuSkeletonProps) {
    const width = useStableSkeletonWidth();

    return (
        <div
            data-slot="sidebar-menu-skeleton"
            data-sidebar="menu-skeleton"
            className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
            {...props}
        >
            {showIcon && (
                <Skeleton
                    className="size-4 rounded-md"
                    data-sidebar="menu-skeleton-icon"
                />
            )}
            <Skeleton
                className="h-4 max-w-(--skeleton-width) flex-1"
                data-sidebar="menu-skeleton-text"
                style={
                    {
                        "--skeleton-width": width,
                    } as CSSProperties
                }
            />
        </div>
    );
}
