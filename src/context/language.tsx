import type { SupportedLanguage } from '@/lib/constants/language-config'
import { createContext } from 'react'

export interface LanguageContextValue {
    language: SupportedLanguage
    setLanguage: (language: SupportedLanguage) => void
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)
