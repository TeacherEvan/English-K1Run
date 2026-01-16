import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'colorful'
export type ResolutionScale = 'auto' | 'small' | 'medium' | 'large'

interface SettingsState {
  theme: Theme
  highContrast: boolean
  reducedMotion: boolean
  resolutionScale: ResolutionScale
  gameplayLanguage: string
  displayLanguage: string
}

interface SettingsContextType extends SettingsState {
  setTheme: (theme: Theme) => void
  setHighContrast: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
  setResolutionScale: (scale: ResolutionScale) => void
  setGameplayLanguage: (lang: string) => void
  setDisplayLanguage: (lang: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'k1-settings'

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'colorful',
  highContrast: false,
  reducedMotion: false,
  resolutionScale: 'auto',
  gameplayLanguage: 'en',
  displayLanguage: 'en',
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }
    return DEFAULT_SETTINGS
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

    // Apply theme to document
    const root = document.documentElement
    root.classList.remove('light-theme', 'dark-theme', 'colorful-theme')
    root.classList.add(`${settings.theme}-theme`)

    // Apply accessibility classes
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (settings.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }
  }, [settings])

  const setTheme = (theme: Theme) => setSettings(s => ({ ...s, theme }))
  const setHighContrast = (highContrast: boolean) => setSettings(s => ({ ...s, highContrast }))
  const setReducedMotion = (reducedMotion: boolean) => setSettings(s => ({ ...s, reducedMotion }))
  const setResolutionScale = (resolutionScale: ResolutionScale) => setSettings(s => ({ ...s, resolutionScale }))
  const setGameplayLanguage = (gameplayLanguage: string) => setSettings(s => ({ ...s, gameplayLanguage }))
  const setDisplayLanguage = (displayLanguage: string) => setSettings(s => ({ ...s, displayLanguage }))

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setTheme,
        setHighContrast,
        setReducedMotion,
        setResolutionScale,
        setGameplayLanguage,
        setDisplayLanguage,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}