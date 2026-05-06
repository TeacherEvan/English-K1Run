import { memo, type CSSProperties, type ReactNode } from "react";

interface MenuActionButtonContentProps {
    icon: ReactNode;
    title: string;
    subtitle?: string;
    iconWrapperClassName?: string;
    subtitleClassName?: string;
    subtitleStyle?: CSSProperties;
    textClassName?: string;
}

export const MenuActionButtonContent = memo(
    ({
        icon,
        title,
        subtitle,
        iconWrapperClassName,
        subtitleClassName,
        subtitleStyle,
        textClassName,
    }: MenuActionButtonContentProps) => {
        return (
            <>
                {iconWrapperClassName ? (
                    <div className={iconWrapperClassName}>{icon}</div>
                ) : (
                    icon
                )}
                <div className={textClassName ?? "flex min-w-0 flex-1 flex-col items-start leading-tight"}>
                    <span className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-normal wrap-anywhere">
                        {title}
                    </span>
                    {subtitle && (
                        <span
                            className={
                                subtitleClassName ?? "mt-1 text-xs font-normal text-muted-foreground/80"
                            }
                            style={subtitleStyle}
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
