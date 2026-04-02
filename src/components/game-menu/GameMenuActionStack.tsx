import type { ReactNode } from "react";

import { MENU_ACTION_STACK_CLASS } from "./menu-surface-theme";

interface GameMenuActionStackProps {
    children: ReactNode;
}

export function GameMenuActionStack({
    children,
}: GameMenuActionStackProps) {
    return (
        <div data-testid="menu-action-stack" className={MENU_ACTION_STACK_CLASS}>
            {children}
        </div>
    );
}
