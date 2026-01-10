import { ReactNode, useEffect, useState } from 'react'
import i18n from '../i18n'
import { DEFAULT_LANGUAGE, isSupportedLanguage, SupportedLanguage } from '../lib/constants/language-config'
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
export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<SupportedLanguage>(() => {
        // Initialize from localStorage during state initialization
        if (typeof window === 'undefined') return DEFAULT_LANGUAGE
        const stored = localStorage.getItem('k1-language')
        return (stored && isSupportedLanguage(stored)) ? stored : DEFAULT_LANGUAGE
    })

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
            setLanguageState(newLanguage)

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
