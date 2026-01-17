import { memo, type ReactNode } from "react";

interface MenuActionButtonContentProps {
    icon: ReactNode;
    title: string;
    subtitle: string;
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
                <div className={textClassName ?? "flex flex-col items-start leading-none"}>
                    <span>{title}</span>
                    <span
                        className={
                            subtitleClassName ?? "text-xs font-normal opacity-90 font-thai mt-1"
                        }
                    >
                        {subtitle}
                    </span>
                </div>
            </>
        );
    }
);

MenuActionButtonContent.displayName = "MenuActionButtonContent";
