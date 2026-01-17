import { memo, useState, useCallback } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ErrorBoundary } from './ErrorBoundary';

interface HomeWindowProps {
    onStartGame: (levelIndex: number, continuousMode: boolean) => void;
    onSettingsChange?: (settings: { fontScale: number; objectScale: number }) => void;
    levels: string[];
    continuousMode?: boolean;
    onToggleContinuousMode?: (enabled: boolean) => void;
}

type TabId = 'levels' | 'settings' | 'credits';

interface TabProps {
    activeTab: TabId;
    levels: string[];
    continuousMode: boolean;
    onStartGame: (levelIndex: number, continuousMode: boolean) => void;
    onToggleContinuousMode?: (enabled: boolean) => void;
    fontScale: number;
    objectScale: number;
    onFontScaleChange: (value: number) => void;
    onObjectScaleChange: (value: number) => void;
    onApplySettings: () => void;
    isApplyingSettings: boolean;
}

// Extracted Tab Components for better maintainability
const LevelsTab = memo(({
    levels,
    continuousMode,
    onStartGame,
    onToggleContinuousMode
}: Pick<TabProps, 'levels' | 'continuousMode' | 'onStartGame' | 'onToggleContinuousMode'>) => {
    const handleStartGame = useCallback((index: number) => {
        try {
            onStartGame(index, continuousMode);
        } catch (error) {
            console.error('Error starting game:', error);
            // TODO: [OPTIMIZATION] Implement global error reporting system
        }
    }, [onStartGame, continuousMode]);

    const handleToggleMode = useCallback((enabled: boolean) => {
        try {
            onToggleContinuousMode?.(enabled);
        } catch (error) {
            console.error('Error toggling continuous mode:', error);
        }
    }, [onToggleContinuousMode]);

    if (levels.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No levels available. Please check your game configuration.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Select Level</h2>
                <p className="text-muted-foreground">Choose a level to start playing</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {levels.map((name, index) => (
                    <Button
                        key={`level-${index}-${name}`}
                        onClick={() => handleStartGame(index)}
                        variant="outline"
                        size="lg"
                        className="h-20 flex flex-col items-center justify-center gap-2 hover:scale-105 hover:shadow-lg transition-all duration-200"
                        aria-label={`Start level ${index + 1}: ${name}`}
                    >
                        <Badge variant="secondary" className="text-xs">
                            Level {index + 1}
                        </Badge>
                        <span className="font-semibold truncate max-w-full">{name}</span>
                    </Button>
                ))}
            </div>

            {onToggleContinuousMode && (
                <div className="flex items-center justify-center gap-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20 hover:bg-primary/10 transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={continuousMode}
                            onChange={(e) => handleToggleMode(e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-primary/40 text-primary cursor-pointer focus:ring-2 focus:ring-primary/50"
                            aria-label="Toggle continuous play mode"
                        />
                        <span className="font-semibold text-foreground">🔄 Continuous Play Mode</span>
                    </label>
                </div>
            )}
        </div>
    );
});

LevelsTab.displayName = 'LevelsTab';

const SettingsTab = memo(({
    fontScale,
    objectScale,
    onFontScaleChange,
    onObjectScaleChange,
    onApplySettings,
    isApplyingSettings
}: Pick<TabProps, 'fontScale' | 'objectScale' | 'onFontScaleChange' | 'onObjectScaleChange' | 'onApplySettings' | 'isApplyingSettings'>) => (
    <div className="space-y-6">
        <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Game Settings</h2>
            <p className="text-muted-foreground">Customize your experience</p>
        </div>

        <div className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="font-scale">
                    Font Scale: {fontScale.toFixed(1)}x
                </label>
                <input
                    id="font-scale"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={fontScale}
                    onChange={(e) => onFontScaleChange(parseFloat(e.target.value))}
                    className="w-full focus:ring-2 focus:ring-primary/50"
                    aria-describedby="font-scale-help"
                />
                <p id="font-scale-help" className="text-xs text-muted-foreground">
                    Adjust text size for better readability
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="object-scale">
                    Object Scale: {objectScale.toFixed(1)}x
                </label>
                <input
                    id="object-scale"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={objectScale}
                    onChange={(e) => onObjectScaleChange(parseFloat(e.target.value))}
                    className="w-full focus:ring-2 focus:ring-primary/50"
                    aria-describedby="object-scale-help"
                />
                <p id="object-scale-help" className="text-xs text-muted-foreground">
                    Adjust game object sizes
                </p>
            </div>

            <Button
                onClick={onApplySettings}
                className="w-full hover:scale-105 transition-transform"
                disabled={isApplyingSettings}
                aria-label="Apply game settings"
            >
                {isApplyingSettings ? 'Applying...' : 'Apply Settings'}
            </Button>
        </div>
    </div>
));

SettingsTab.displayName = 'SettingsTab';

const CreditsTab = memo(() => (
    <div className="space-y-6 text-center">
        <div>
            <h2 className="text-xl font-semibold mb-4">Credits</h2>
            <div className="space-y-4 text-muted-foreground">
                <div>
                    <h3 className="font-semibold text-foreground">Game Development</h3>
                    <p>Built with React, TypeScript, and Tailwind CSS</p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Audio</h3>
                    <p>Generated with ElevenLabs AI</p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Special Thanks</h3>
                    <p>Sangsom Kindergarten for inspiration</p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Version</h3>
                    <p>Kindergarten Race v2.0 - Dec 2025</p>
                </div>
            </div>
        </div>
    </div>
));

CreditsTab.displayName = 'CreditsTab';

const TabContent = memo((props: TabProps) => {
    const { activeTab } = props;

    switch (activeTab) {
        case 'levels':
            return <LevelsTab {...props} />;
        case 'settings':
            return <SettingsTab {...props} />;
        case 'credits':
            return <CreditsTab />;
        default:
            return null;
    }
});

TabContent.displayName = 'TabContent';

export const HomeWindow = memo(({
    onStartGame,
    onSettingsChange,
    levels,
    continuousMode = false,
    onToggleContinuousMode
}: HomeWindowProps) => {
    const [activeTab, setActiveTab] = useState<TabId>('levels');
    const [fontScale, setFontScale] = useState(1);
    const [objectScale, setObjectScale] = useState(1);
    const [isApplyingSettings, setIsApplyingSettings] = useState(false);

    const handleTabChange = useCallback((tabId: TabId) => {
        setActiveTab(tabId);
    }, []);

    const handleFontScaleChange = useCallback((value: number) => {
        setFontScale(value);
    }, []);

    const handleObjectScaleChange = useCallback((value: number) => {
        setObjectScale(value);
    }, []);

    const handleApplySettings = useCallback(async () => {
        setIsApplyingSettings(true);
        try {
            await onSettingsChange?.({ fontScale, objectScale });
            // Add brief delay for UX feedback
            setTimeout(() => setIsApplyingSettings(false), 500);
        } catch (error) {
            console.error('Error applying settings:', error);
            setIsApplyingSettings(false);
            // TODO: [OPTIMIZATION] Show user-friendly error message
        }
    }, [onSettingsChange, fontScale, objectScale]);

    const tabs: Array<{ id: TabId; label: string; icon: string }> = [
        { id: 'levels', label: 'Levels', icon: '🎯' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'credits', label: 'Credits', icon: '👥' }
    ];

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
        isApplyingSettings
    };

    return (
        <ErrorBoundary fallback={<div className="text-center p-8">Something went wrong. Please refresh the page.</div>}>
            <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
                <Card className="p-8 max-w-4xl mx-4 bg-card shadow-2xl border-4 border-primary/20 animate-in zoom-in duration-500">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4 animate-bounce">🏠</div>
                        <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Kindergarten Race</h1>
                        <p className="text-muted-foreground">Choose your adventure!</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center mb-6" role="tablist" aria-label="Game menu tabs">
                        <div className="flex space-x-2 bg-secondary/20 rounded-lg p-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    aria-controls={`tabpanel-${tab.id}`}
                                    id={`tab-${tab.id}`}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 hover:scale-105 ${
                                        activeTab === tab.id
                                            ? 'bg-primary text-primary-foreground shadow-md'
                                            : 'hover:bg-secondary/40'
                                    }`}
                                >
                                    <span aria-hidden="true">{tab.icon}</span>
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]" role="tabpanel" aria-labelledby={`tab-${activeTab}`} id={`tabpanel-${activeTab}`}>
                        <TabContent {...tabProps} />
                    </div>
                </Card>
            </div>
        </ErrorBoundary>
    );
});

HomeWindow.displayName = 'HomeWindow';