/**
 * Sidebar Menu Components
 * Barrel export file to maintain backward compatibility
 * 
 * Usage: import { SidebarMenu, SidebarMenuItem, ... } from './components/ui/sidebar/sidebar-menu'
 */

// Main menu container components
export { SidebarMenu, SidebarMenuItem } from "./SidebarMenuContainer";

// Button components
export {
    SidebarMenuAction,
    SidebarMenuBadge, SidebarMenuButton
} from "./SidebarMenuButton";

// Section & sub-menu components
export {
    SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem
} from "./SidebarMenuSection";

// Type exports for consumers
export type {
    SidebarMenuActionProps, SidebarMenuButtonProps, SidebarMenuSkeletonProps,
    SidebarMenuSubButtonProps
} from "./types";

