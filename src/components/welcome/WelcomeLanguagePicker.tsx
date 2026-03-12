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
                className="welcome-language-panel"
                onClick={(event) => event.stopPropagation()}
                data-testid="welcome-language-picker"
            >
                <p className="welcome-language-title">
                    {t('welcome.languageTitle', {
                        defaultValue: 'Choose your language',
                    })}
                </p>
                <p className="welcome-language-description">
                    {t('welcome.languageDescription', {
                        defaultValue:
                            'Pick English or Thai before the welcome audio starts. You can change it later in Settings.',
                    })}
                </p>

                <div
                    className="welcome-language-buttons"
                    role="group"
                    aria-label={t('game.selectLanguage')}
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
            </div>
        )
    },
)

WelcomeLanguagePicker.displayName = 'WelcomeLanguagePicker'