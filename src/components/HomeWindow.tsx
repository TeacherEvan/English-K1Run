import { memo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface HomeWindowProps {
    onStartGame: (levelIndex: number, continuousMode: boolean) => void;
    onSettingsChange?: (settings: { fontScale: number; objectScale: number }) => void;
    levels: string[];
    continuousMode?: boolean;
    onToggleContinuousMode?: (enabled: boolean) => void;
}

type TabId = 'levels' | 'settings' | 'credits';

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

    const handleSettingsChange = () => {
        onSettingsChange?.({ fontScale, objectScale });
    };

    const tabs: Array<{ id: TabId; label: string; icon: string }> = [
        { id: 'levels', label: 'Levels', icon: '🎯' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'credits', label: 'Credits', icon: '👥' }
    ];

    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <Card className="p-8 max-w-4xl mx-4 bg-card shadow-2xl border-4 border-primary/20 animate-in zoom-in duration-500">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🏠</div>
                    <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Kindergarten Race</h1>
                    <p className="text-muted-foreground">Choose your adventure!</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-6">
                    <div className="flex space-x-2 bg-secondary/20 rounded-lg p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === tab.id
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'hover:bg-secondary/40'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'levels' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold mb-2">Select Level</h2>
                                <p className="text-muted-foreground">Choose a level to start playing</p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {levels.map((name, index) => (
                                    <Button
                                        key={`${index}-${name}`}
                                        onClick={() => onStartGame(index, continuousMode)}
                                        variant="outline"
                                        size="lg"
                                        className="h-20 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform"
                                    >
                                        <Badge variant="secondary" className="text-xs">
                                            Level {index + 1}
                                        </Badge>
                                        <span className="font-semibold truncate max-w-full">{name}</span>
                                    </Button>
                                ))}
                            </div>

                            {/* Continuous Mode Toggle */}
                            {onToggleContinuousMode && (
                                <div className="flex items-center justify-center gap-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={continuousMode}
                                            onChange={(e) => onToggleContinuousMode(e.target.checked)}
                                            className="w-5 h-5 rounded border-2 border-primary/40 text-primary cursor-pointer"
                                        />
                                        <span className="font-semibold text-foreground">🔄 Continuous Play Mode</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold mb-2">Game Settings</h2>
                                <p className="text-muted-foreground">Customize your experience</p>
                            </div>

                            <div className="space-y-6 max-w-md mx-auto">
                                {/* Font Scale */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Font Scale: {fontScale.toFixed(1)}x</label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.1"
                                        value={fontScale}
                                        onChange={(e) => setFontScale(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                {/* Object Scale */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Object Scale: {objectScale.toFixed(1)}x</label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.1"
                                        value={objectScale}
                                        onChange={(e) => setObjectScale(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>

                                <Button onClick={handleSettingsChange} className="w-full">
                                    Apply Settings
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'credits' && (
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
                                        <p>Lalitaporn Kindergarten for inspiration</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Version</h3>
                                        <p>Kindergarten Race v2.0 - Dec 2025</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
});

HomeWindow.displayName = 'HomeWindow';