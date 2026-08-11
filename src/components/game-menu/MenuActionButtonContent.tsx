import { memo, type ReactNode } from "react";

interface MenuActionButtonContentProps {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    iconWrapperClassName?: string;
    subtitleClassName?: string;
    textClassName?: string;
}

export const MenuActionButtonContent = memo(
    ({
        icon,
        title,
        subtitle,
        iconWrapperClassName,
        subtitleClassName,
        textClassName,
    }: MenuActionButtonContentProps) => {
        return (
            <>
                {iconWrapperClassName ? (
                    <div className={iconWrapperClassName}>{icon}</div>
                ) : (
                    icon
                )}
                <div className={textClassName ?? "flex flex-col items-start leading-tight"}>
                    <span>{title}</span>
                    {subtitle && (
                        <span
                            className={
                                subtitleClassName ?? "mt-1 text-xs font-normal text-muted-foreground/80"
                            }
                        >
                            {subtitle}
                        </span>
                    )}
                </div>
            </>
        );
    }
);

MenuActionButtonContent.displayName = "MenuActionButtonContent";
