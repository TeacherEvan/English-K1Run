import { Progress } from '@/components/ui/progress'
import { memo } from 'react'

import './StartupLoadingScreen.css'

interface StartupLoadingScreenProps {
  percentage: number
  phase: 'branding' | 'introReady' | 'cacheWarm' | 'complete'
  label: string
}

export const StartupLoadingScreen = memo(
  ({ percentage, phase, label }: StartupLoadingScreenProps) => (
    <div
      className="startup-loading-screen"
      data-testid="startup-loading-screen"
    >
      <img
        className="startup-loading-screen__background"
        src="/welcome-sangsom.png"
        alt=""
        aria-hidden="true"
        data-testid="startup-loading-background"
      />
      <div className="startup-loading-screen__overlay" aria-hidden="true" />
      <div className="startup-loading-screen__hud">
        <p className="startup-loading-screen__label">{label}</p>
        <Progress
          value={percentage}
          aria-label="Startup loading progress"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className="startup-loading-screen__progress"
        />
        <p
          className="startup-loading-screen__phase"
          data-testid="startup-loading-phase"
        >
          {phase}
        </p>
      </div>
    </div>
  ),
)

StartupLoadingScreen.displayName = 'StartupLoadingScreen'
