import { useSettings } from '@/context/settings-context'
import {
    LANGUAGE_OPTIONS,
    type SupportedLanguage,
} from '@/lib/constants/language-config'
import { memo, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

type ActivationSource = 'keyboard' | 'pointer' | null

const STARTUP_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter(
    (option): option is {
        value: SupportedLanguage
        label: string
        nativeLabel: string
    } => option.value === 'en' || option.value === 'th',
)

interface WelcomeLanguagePickerProps {
    disabled: boolean
    onLanguageSelected?: (shouldRestoreFocus: boolean) => void
}

export const WelcomeLanguagePicker = memo(
    ({ disabled, onLanguageSelected }: WelcomeLanguagePickerProps) => {
        const { t } = useTranslation()
        const activationSourceRef = useRef<ActivationSource>(null)
        const {
            displayLanguage,
            gameplayLanguage,
            setDisplayLanguage,
            setGameplayLanguage,
        } = useSettings()

        const selectedLanguage =
            displayLanguage === gameplayLanguage &&
                STARTUP_LANGUAGE_OPTIONS.some((option) => option.value === gameplayLanguage)
                ? gameplayLanguage
                : undefined

        const handleLanguageSelect = (
            language: SupportedLanguage,
            _event: MouseEvent<HTMLButtonElement>,
        ) => {
            if (disabled) return

            const shouldRestoreFocus = activationSourceRef.current === 'keyboard'
            activationSourceRef.current = null

            setDisplayLanguage(language)
            setGameplayLanguage(language)
            onLanguageSelected?.(shouldRestoreFocus)
        }

        const handlePointerDown = (_event: PointerEvent<HTMLButtonElement>) => {
            activationSourceRef.current = 'pointer'
        }

        const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                activationSourceRef.current = 'keyboard'
            }
        }

        return (
            <div
                className="welcome-language-picker"
                role="group"
                aria-label={t('game.selectLanguage')}
                data-testid="welcome-language-picker"
            >
                {STARTUP_LANGUAGE_OPTIONS.map((option) => {
                    const isSelected = selectedLanguage === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            className={`welcome-language-button ${isSelected ? 'welcome-language-button--selected' : ''}`.trim()}
                            onKeyDown={handleKeyDown}
                            onPointerDown={handlePointerDown}
                            onClick={(event) => handleLanguageSelect(option.value, event)}
                            aria-pressed={isSelected}
                            disabled={disabled}
                            data-testid={`welcome-language-${option.value}`}
                        >
                            <span className="welcome-language-button-label">
                                {option.label}
                            </span>
                            <span className="welcome-language-button-native">
                                {option.nativeLabel}
                            </span>
                        </button>
                    )
                })}
            </div>
        )
    },
)

WelcomeLanguagePicker.displayName = 'WelcomeLanguagePicker'
