/**
 * Settings tab content for display scaling.
 * Uses sliders to adjust font and object scale.
 */
import type { TabProps } from '@/components/home-window/HomeWindow.types'
import { Button } from '@/components/ui/button'
import { memo } from 'react'

export const SettingsTab = memo(({
    fontScale,
    objectScale,
    onFontScaleChange,
    onObjectScaleChange,
    onApplySettings,
    isApplyingSettings,
}: Pick<
    TabProps,
    | 'fontScale'
    | 'objectScale'
    | 'onFontScaleChange'
    | 'onObjectScaleChange'
    | 'onApplySettings'
    | 'isApplyingSettings'
>) => (
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
))

SettingsTab.displayName = 'SettingsTab'
