/**
 * Language Selector Component
 * WCAG-compliant accessible dropdown for language selection
 * Supports keyboard navigation and screen readers
 */

import { useLanguage } from '@/hooks/use-language'
import { LANGUAGE_OPTIONS, SupportedLanguage } from '@/lib/constants/language-config'
import { cn } from '@/lib/utils'
import * as SelectPrimitive from '@radix-ui/react-select'
// import { Check, ChevronDown } from 'lucide-react'
import React, { useState } from 'react'

const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-check", className)}>
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)
const ChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-chevron-down", className)}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

interface LanguageSelectorProps {
    className?: string
    onLanguageChange?: (language: SupportedLanguage) => void
    showLabel?: boolean
    disabled?: boolean
}

/**
 * Accessible language selector dropdown
 * Uses Radix UI Select for built-in WCAG compliance
 */
export const LanguageSelector = React.forwardRef<
    HTMLButtonElement,
    LanguageSelectorProps
>(({ className, onLanguageChange, showLabel = true, disabled = false }, ref) => {
    const { language, setLanguage } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    const handleLanguageChange = (value: string) => {
        if (value !== language) {
            setLanguage(value as SupportedLanguage)
            setIsOpen(false)

            // Notify parent component of language change
            if (onLanguageChange) {
                onLanguageChange(value as SupportedLanguage)
            }
        }
    }

    const currentLanguageLabel =
        LANGUAGE_OPTIONS.find((opt) => opt.value === language)?.label || 'English'

    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <label
                    className="block text-sm font-medium text-foreground mb-2"
                    id="language-selector-label"
                >
                    Select Language
                </label>
            )}

            <SelectPrimitive.Root
                value={language}
                onValueChange={handleLanguageChange}
                disabled={disabled}
                open={isOpen}
                onOpenChange={setIsOpen}
            >
                <SelectPrimitive.Trigger
                    ref={ref}
                    className={cn(
                        'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm outline-none',
                        'placeholder:text-muted-foreground',
                        'focus:ring-2 focus:ring-ring/50 focus:border-ring',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'data-[state=open]:border-ring data-[state=open]:ring-2 data-[state=open]:ring-ring/50',
                        'transition-colors duration-200 hover:border-input/80',
                        'aria-label-by="language-selector-label"'
                    )}
                    aria-label="Select gameplay language"
                    aria-describedby="language-selector-description"
                    aria-expanded={isOpen}
                >
                    <SelectPrimitive.Value
                        className="flex-1 text-left"
                        asChild
                    >
                        <span className="flex items-center gap-2">
                            <span>{currentLanguageLabel}</span>
                        </span>
                    </SelectPrimitive.Value>
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown
                            className={cn(
                                'size-4 opacity-50 transition-transform duration-200',
                                isOpen && 'rotate-180'
                            )}
                            aria-hidden="true"
                        />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>

                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        className={cn(
                            'relative z-50 max-w-xs overflow-hidden rounded-md border border-input bg-popover shadow-md',
                            'animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
                            'data-[side=top]:slide-in-from-bottom-2'
                        )}
                        position="popper"
                        sideOffset={8}
                    >
                        <SelectPrimitive.Viewport className="p-1">
                            <SelectPrimitive.Group>
                                <SelectPrimitive.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    Languages
                                </SelectPrimitive.Label>

                                {LANGUAGE_OPTIONS.map((option) => (
                                    <SelectPrimitive.Item
                                        key={option.value}
                                        value={option.value}
                                        className={cn(
                                            'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                                            'focus:bg-accent focus:text-accent-foreground',
                                            'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                                            'hover:bg-accent hover:text-accent-foreground',
                                            'transition-colors duration-150'
                                        )}
                                        role="option"
                                        aria-selected={language === option.value}
                                    >
                                        <span className="absolute left-2 flex size-3.5 items-center justify-center">
                                            <SelectPrimitive.ItemIndicator asChild>
                                                <Check
                                                    className="size-4 font-bold text-primary"
                                                    aria-hidden="true"
                                                />
                                            </SelectPrimitive.ItemIndicator>
                                        </span>

                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium">{option.label}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {option.nativeLabel}
                                            </span>
                                        </div>
                                    </SelectPrimitive.Item>
                                ))}
                            </SelectPrimitive.Group>
                        </SelectPrimitive.Viewport>

                        {/* Scrollbar (optional, visible on overflow) */}
                        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center bg-popover py-1 text-muted-foreground">
                            <ChevronDown className="size-4" aria-hidden="true" />
                        </SelectPrimitive.ScrollDownButton>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>

            <p
                id="language-selector-description"
                className="mt-1 text-xs text-muted-foreground"
            >
                Changes will apply to gameplay text and voiceovers
            </p>
        </div>
    )
})

LanguageSelector.displayName = 'LanguageSelector'
