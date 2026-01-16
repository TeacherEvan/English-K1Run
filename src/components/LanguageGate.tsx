import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useLanguage } from '@/hooks/use-language'
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '@/lib/constants/language-config'

import './LanguageGate.css'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { LanguageSelector } from './ui/language-selector'

interface LanguageGateProps {
    onContinue: () => void
    defaultToLevels?: boolean
}

export const LanguageGate = memo(({ onContinue }: LanguageGateProps) => {
    const { t } = useTranslation()
    const { language, setLanguage } = useLanguage()
    const [showAllLanguages, setShowAllLanguages] = useState(false)

    const primaryLanguages = useMemo(() => {
        const primary: SupportedLanguage[] = ['en', 'th']
        return primary
    }, [])

    const languageLabels = useMemo(() => {
        const map = new Map<SupportedLanguage, string>()
        for (const opt of LANGUAGE_OPTIONS) {
            map.set(opt.value, opt.nativeLabel)
        }
        return map
    }, [])

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300"
            data-testid="language-select"
        >
            {/* Background Image reused from Welcome Screen for continuity */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/welcome-sangsom.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-100" // Opacity to ensure visibility
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" /> {/* Overlay for readability */}
            </div>

            <Card className="w-full max-w-3xl mx-4 p-8 bg-card/90 border-4 border-primary/20 shadow-2xl backdrop-blur-md z-10">
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="text-7xl select-none">🌍</div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-primary tracking-tight">
                            {t('settings.language', 'Choose Language')}
                        </h1>
                        <p className="text-lg text-foreground/80">
                            {t('settings.languageDescription', 'Select your language, then choose a level.')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                        {primaryLanguages.map((code) => {
                            const isSelected = language === code
                            return (
                                <Button
                                    key={code}
                                    type="button"
                                    className="h-20 text-2xl"
                                    variant={isSelected ? 'default' : 'outline'}
                                    onClick={() => setLanguage(code)}
                                >
                                    <span className="mr-3 text-3xl">{code === 'en' ? '🇬🇧' : '🇹🇭'}</span>
                                    {languageLabels.get(code) ?? code}
                                </Button>
                            )
                        })}
                    </div>

                    <div className="w-full max-w-xl">
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => setShowAllLanguages((v) => !v)}
                        >
                            {showAllLanguages
                                ? t('common.hide', 'Hide other languages')
                                : t('common.more', 'More languages')}
                        </Button>

                        {showAllLanguages && (
                            <div className="mt-3">
                                <LanguageSelector showLabel={false} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
                        <Button
                            type="button"
                            className="h-16 text-2xl w-full"
                            onClick={onContinue}
                        >
                            {t('common.continue', 'Continue')}
                        </Button>
                    </div>

                    {/* Pulsating Gold Native Language Tip */}
                    <div className="native-language-tip">
                        <span className="native-language-tip-emoji">⭐</span>
                        <p className="native-language-tip-text">
                            {t('languageGate.nativeLanguageTip', 'First play one or two levels in your native language before playing the other languages!')}
                        </p>
                        <span className="native-language-tip-emoji">⭐</span>
                    </div>

                    <p className="text-sm text-muted-foreground max-w-xl">
                        {t(
                            'settings.audioNote',
                            'Audio may require a tap/click to start, depending on browser settings.'
                        )}
                    </p>
                </div>
            </Card>
        </div>
    )
})

LanguageGate.displayName = 'LanguageGate'
