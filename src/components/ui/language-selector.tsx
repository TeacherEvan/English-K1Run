import * as SelectPrimitive from '@radix-ui/react-select'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/context/settings-context'
import { useLanguage } from '@/hooks/use-language'
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '@/lib/constants/language-config'
import { cn } from '@/lib/utils'
import { LanguageSelectorOptionContent } from './language-selector-option-content'

const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('lucide lucide-check', className)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const ChevronDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('lucide lucide-chevron-down', className)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export type LanguageHighlightVariant = 'none' | 'sibling' | 'spotlight'

interface LanguageSelectorProps {
  className?: string
  disabled?: boolean
  highlightVariant?: LanguageHighlightVariant
  languageType?: 'display' | 'gameplay'
  onLanguageChange?: (language: SupportedLanguage) => void
  showLabel?: boolean
}

export const LanguageSelector = React.forwardRef<HTMLButtonElement, LanguageSelectorProps>(
  ({
    className,
    disabled = false,
    highlightVariant = 'none',
    languageType = 'display',
    onLanguageChange,
    showLabel = true,
  }, ref) => {
    const { t } = useTranslation()
    const { language: displayLanguage, setLanguage: setDisplayLanguage } = useLanguage()
    const { gameplayLanguage, setGameplayLanguage } = useSettings()
    const [isOpen, setIsOpen] = useState(false)
    const language = languageType === 'gameplay' ? gameplayLanguage : displayLanguage
    const setLanguage = languageType === 'gameplay' ? setGameplayLanguage : setDisplayLanguage
    const labelId = `${languageType}-language-selector-label`
    const descriptionId = `${languageType}-language-selector-description`
    const labelText = languageType === 'gameplay'
      ? t('settings.controls.gameplayLanguageTitle')
      : t('settings.controls.displayLanguageTitle')
    const descriptionText = languageType === 'gameplay'
      ? t('settings.controls.gameplayLanguageDescription')
      : t('settings.controls.displayLanguageDescription')
    const ariaLabel = languageType === 'gameplay'
      ? t('settings.controls.selectGameplayLanguage')
      : t('settings.controls.selectDisplayLanguage')

    const handleLanguageChange = (value: string) => {
      if (value !== language) {
        setLanguage(value as SupportedLanguage)
        setIsOpen(false)
        onLanguageChange?.(value as SupportedLanguage)
      }
    }

    const currentLanguageLabel =
      LANGUAGE_OPTIONS.find((option) => option.value === language)?.label || 'English'

    return (
      <div
        className={cn('language-selector-shell w-full', className)}
        data-language-highlight={highlightVariant}
        data-language-type={languageType}
      >
        {showLabel && (
          <label className="language-selector-label mb-2 block text-sm font-medium text-foreground" id={labelId}>
            {labelText}
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
              'language-selector-trigger flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm outline-none',
              'placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'data-[state=open]:border-ring data-[state=open]:ring-2 data-[state=open]:ring-ring/50',
              'transition-colors duration-200 hover:border-input/80',
            )}
            aria-label={ariaLabel}
            aria-describedby={descriptionId}
            aria-labelledby={showLabel ? labelId : undefined}
            aria-expanded={isOpen}
            data-language-highlight={highlightVariant}
            data-language-type={languageType}
          >
            <SelectPrimitive.Value className="flex-1 text-left" asChild>
              <span className="language-selector-value flex items-center gap-2">
                <span>{currentLanguageLabel}</span>
              </span>
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild>
              <ChevronDown className={cn('size-4 opacity-50 transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden="true" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={cn(
                'language-selector-content relative z-170 max-w-xs overflow-hidden rounded-md border border-input bg-popover shadow-md',
                'animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
                'data-[side=top]:slide-in-from-bottom-2',
              )}
              position="popper"
              sideOffset={8}
              data-language-highlight={highlightVariant}
              data-language-type={languageType}
            >
              <SelectPrimitive.Viewport className="p-1">
                <SelectPrimitive.Group>
                  <SelectPrimitive.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {t('settings.controls.languageGroupLabel')}
                  </SelectPrimitive.Label>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectPrimitive.Item
                      key={option.value}
                      value={option.value}
                      className={cn(
                        'language-selector-option relative mt-1 flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                        'focus:bg-accent focus:text-accent-foreground',
                        'data-disabled:pointer-events-none data-disabled:opacity-50',
                        'hover:bg-accent hover:text-accent-foreground transition-colors duration-150',
                      )}
                      role="option"
                      aria-selected={language === option.value}
                      data-language-option-highlight={highlightVariant}
                      data-language-type={languageType}
                    >
                      <span className="absolute left-2 flex size-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator asChild>
                          <Check className="size-4 font-bold text-primary" aria-hidden="true" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <LanguageSelectorOptionContent label={option.label} nativeLabel={option.nativeLabel} />
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Group>
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center bg-popover py-1 text-muted-foreground">
                <ChevronDown className="size-4" aria-hidden="true" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        <p id={descriptionId} className="language-selector-description mt-1 text-xs text-muted-foreground">
          {descriptionText}
        </p>
      </div>
    )
  },
)

LanguageSelector.displayName = 'LanguageSelector'
