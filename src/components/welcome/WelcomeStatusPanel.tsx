import { CLASSROOM_BRAND } from '@/lib/constants/classroom-brand'
import { memo } from 'react'

import type { WelcomePhase } from './welcome-phase'
import './WelcomeStatusPanel.css'

interface WelcomeStatusPanelProps {
  actionLabel: string
  statusLabel: string
  diagnosticLabel?: string | null
  phase: WelcomePhase
  interactionLocked: boolean
  isSequencePlaying: boolean
  currentAudioIndex: number
  totalAudioCount: number
  onPrimaryAction: () => void
}

export const WelcomeStatusPanel = memo(
  ({
    actionLabel,
    statusLabel,
    diagnosticLabel,
    phase,
    interactionLocked,
    isSequencePlaying,
    currentAudioIndex,
    totalAudioCount,
    onPrimaryAction,
  }: WelcomeStatusPanelProps) => (
    <div
      className={`welcome-status-panel ${interactionLocked ? 'welcome-status-panel--steady' : 'welcome-status-panel--pulse'}`}
      data-testid="welcome-status-panel"
    >
      <p className="welcome-status-panel__eyebrow">{CLASSROOM_BRAND.name}</p>
      <p
        className="welcome-status-panel__label"
        data-testid="welcome-status-label"
        role="status"
        aria-live="polite"
      >
        {statusLabel}
      </p>
      {diagnosticLabel ? (
        <p
          className="welcome-status-panel__diagnostic"
          data-testid="welcome-diagnostic-label"
          role="status"
          aria-live="polite"
        >
          {diagnosticLabel}
        </p>
      ) : null}
      <button
        type="button"
        className={`welcome-primary-button welcome-primary-button--${phase}`}
        onClick={(event) => {
          event.stopPropagation()
          onPrimaryAction()
        }}
        data-testid="welcome-primary-button"
        aria-disabled={interactionLocked}
        disabled={interactionLocked}
      >
        <span className="welcome-primary-button__text">{actionLabel}</span>
      </button>
      {isSequencePlaying && totalAudioCount > 0 ? (
        <div className="welcome-progress" aria-hidden="true">
          {Array.from({ length: totalAudioCount }).map((_, index) => {
            const progressClassName =
              index < currentAudioIndex
                ? 'welcome-progress-dot welcome-progress-dot--complete'
                : index === currentAudioIndex
                  ? 'welcome-progress-dot welcome-progress-dot--active'
                  : 'welcome-progress-dot'

            return (
              <span
                key={index}
                className={progressClassName}
                data-testid={`audio-progress-${index}`}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  ),
)

WelcomeStatusPanel.displayName = 'WelcomeStatusPanel'
