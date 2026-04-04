import { CLASSROOM_BRAND } from '@/lib/constants/classroom-brand'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { WelcomeLanguagePicker } from './WelcomeLanguagePicker'

interface WelcomeLanguageShellProps {
  disabled: boolean
  onLanguageSelected?: (shouldRestoreFocus: boolean) => void
}

export const WelcomeLanguageShell = memo(
  ({ disabled, onLanguageSelected }: WelcomeLanguageShellProps) => {
    const { t } = useTranslation()

    return (
      <section
        className="welcome-language-shell"
        data-testid="welcome-language-shell"
        aria-labelledby="welcome-language-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="welcome-language-shell__pill">{CLASSROOM_BRAND.signature}</p>
        <h2 id="welcome-language-title" className="welcome-language-shell__title">
          {t('welcome.languageTitle', {
            defaultValue: 'Choose your language',
          })}
        </h2>
        <p className="welcome-language-shell__description">
          {t('welcome.languageDescription', {
            defaultValue:
              'Pick English or Thai before the welcome audio starts. You can change it later in Settings.',
          })}
        </p>
        <WelcomeLanguagePicker
          disabled={disabled}
          onLanguageSelected={onLanguageSelected}
        />
      </section>
    )
  },
)

WelcomeLanguageShell.displayName = 'WelcomeLanguageShell'
