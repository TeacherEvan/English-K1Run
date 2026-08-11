import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { MENU_ACTION_STACK_CLASS } from "./menu-surface-theme";

interface GameMenuActionStackProps {
    children: ReactNode;
    className?: string;
}

export function GameMenuActionStack({
    children,
    className,
}: GameMenuActionStackProps) {
    return (
        <div
            data-testid="menu-action-stack"
            className={cn(MENU_ACTION_STACK_CLASS, className)}
        >
            {children}
        </div>
    );
}
