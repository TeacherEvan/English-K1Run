import { useSettings } from '@/context/settings-context'
import {
    LANGUAGE_OPTIONS,
    type SupportedLanguage,
} from '@/lib/constants/language-config'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

const STARTUP_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter(
    (option): option is {
        value: SupportedLanguage
        label: string
        nativeLabel: string
    } => option.value === 'en' || option.value === 'th',
)

interface WelcomeLanguagePickerProps {
    disabled: boolean
}

export const WelcomeLanguagePicker = memo(
    ({ disabled }: WelcomeLanguagePickerProps) => {
        const { t } = useTranslation()
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

        const handleLanguageSelect = (language: SupportedLanguage) => {
            if (disabled) return
            setDisplayLanguage(language)
            setGameplayLanguage(language)
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
                            onClick={() => handleLanguageSelect(option.value)}
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
