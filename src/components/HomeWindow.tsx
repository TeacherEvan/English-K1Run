import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { HomeWindowProps, TabConfig, TabId, TabProps } from '@/components/home-window/HomeWindow.types'
import { HomeWindowHeader } from '@/components/home-window/HomeWindowHeader'
import { HomeWindowTabs } from '@/components/home-window/HomeWindowTabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { errorReporter } from '@/lib/error-reporter'
import { memo, useCallback, useState } from 'react'

export const HomeWindow = memo(
    ({
        onStartGame,
        onSettingsChange,
        levels,
        continuousMode = false,
        onToggleContinuousMode,
    }: HomeWindowProps) => {
        const [activeTab, setActiveTab] = useState<TabId>('levels')
        const [fontScale, setFontScale] = useState(1)
        const [objectScale, setObjectScale] = useState(1)
        const [isApplyingSettings, setIsApplyingSettings] = useState(false)

        const handleTabChange = useCallback((tabId: TabId) => {
            setActiveTab(tabId)
        }, [])

        const handleFontScaleChange = useCallback((value: number) => {
            setFontScale(value)
        }, [])

        const handleObjectScaleChange = useCallback((value: number) => {
            setObjectScale(value)
        }, [])

        const handleApplySettings = useCallback(async () => {
            setIsApplyingSettings(true)
            try {
                await onSettingsChange?.({ fontScale, objectScale })
                setTimeout(() => setIsApplyingSettings(false), 500)
            } catch (error) {
                errorReporter.reportError(
                    error instanceof Error ? error : new Error(String(error)),
                    'settings',
                    { fontScale, objectScale },
                )
                setIsApplyingSettings(false)
            }
        }, [onSettingsChange, fontScale, objectScale])

        const tabs: TabConfig[] = [
            { id: 'levels', label: 'Levels', icon: '🎯' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            { id: 'credits', label: 'Credits', icon: '👥' },
        ]

        const tabProps: TabProps = {
            activeTab,
            levels,
            continuousMode,
            onStartGame,
            onToggleContinuousMode,
            fontScale,
            objectScale,
            onFontScaleChange: handleFontScaleChange,
            onObjectScaleChange: handleObjectScaleChange,
            onApplySettings: handleApplySettings,
            isApplyingSettings,
        }

        return (
            <ErrorBoundary
                fallback={(_error, _errorInfo, reset) => (
                    <div className="text-center p-8 space-y-4">
                        <p className="text-lg font-semibold">
                            Something went wrong. Please refresh the page.
                        </p>
                        <Button onClick={reset} variant="outline">
                            Try Again
                        </Button>
                    </div>
                )}
            >
                <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <Card className="p-8 max-w-4xl mx-4 bg-card shadow-2xl border-4 border-primary/20 animate-in zoom-in duration-500">
                        <HomeWindowHeader />
                        <HomeWindowTabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            tabProps={tabProps}
                        />
                    </Card>
                </div>
            </ErrorBoundary>
        )
    },
)

HomeWindow.displayName = 'HomeWindow'