"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * SidebarMenu - Main container for menu items
 * Provides vertical layout with consistent spacing
 */
export function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
    return (
        <ul
            data-slot="sidebar-menu"
            data-sidebar="menu"
            className={cn("flex w-full min-w-0 flex-col gap-1", className)}
            {...props}
        />
    );
}

/**
 * SidebarMenuItem - Individual menu item wrapper
 * Provides grouping context for hover/focus states
 */
export function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
    return (
        <li
            data-slot="sidebar-menu-item"
            data-sidebar="menu-item"
            className={cn("group/menu-item relative", className)}
            {...props}
        />
    );
}
