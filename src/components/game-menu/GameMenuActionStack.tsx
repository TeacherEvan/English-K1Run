import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

import { MENU_ACTION_STACK_CLASS } from "./menu-surface-theme";

interface GameMenuActionStackProps extends Omit<ComponentProps<"div">, "children"> {
    children: ReactNode;
}

export function GameMenuActionStack({
    children,
    className,
    ...props
}: GameMenuActionStackProps) {
    return (
        <div
            data-testid="menu-action-stack"
            className={cn(MENU_ACTION_STACK_CLASS, className)}
            {...props}
        >
            {children}
        </div>
    );
}
