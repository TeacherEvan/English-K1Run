import { type ReactNode, useEffect, useMemo } from 'react'
import i18n from '../i18n'
import { isSupportedLanguage, type SupportedLanguage } from '../lib/constants/language-config'
import { eventTracker } from '../lib/event-tracker'
import { soundManager } from '../lib/sound-manager'
import { LanguageContext } from './language'

interface LanguageProviderProps {
    children: ReactNode
}

/**
 * Language Provider component
 * Manages global language state and persists selection to localStorage
 */
import { useSettings } from './settings-context'

export function LanguageProvider({ children }: LanguageProviderProps) {
    const { displayLanguage, setDisplayLanguage } = useSettings()

    // Use displayLanguage from settings as the source of truth
    const language = useMemo(() =>
        isSupportedLanguage(displayLanguage) ? displayLanguage as SupportedLanguage : 'en' as SupportedLanguage
        , [displayLanguage])

    // Sync language to localStorage, i18n, and sound manager
    useEffect(() => {
        localStorage.setItem('k1-language', language)
        void i18n.changeLanguage(language)
        soundManager.setLanguage(language)
    }, [language])

    // Update language with telemetry tracking
    const setLanguage = (newLanguage: SupportedLanguage) => {
        if (isSupportedLanguage(newLanguage)) {
            const previousLanguage = language
            setDisplayLanguage(newLanguage)

            // Track language change (anonymized - only language codes)
            eventTracker.trackLanguageChange(newLanguage, previousLanguage)
        }
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    )
}