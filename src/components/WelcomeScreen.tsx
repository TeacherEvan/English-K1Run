import { WelcomeLanguageShell } from '@/components/welcome/WelcomeLanguageShell'
import { WelcomeStatusPanel } from '@/components/welcome/WelcomeStatusPanel'
import { useWelcomeSequence } from '@/components/welcome/use-welcome-sequence'
import { isWelcomeInteractionLocked } from '@/components/welcome/welcome-phase'
import { useSettings } from '@/context/settings-context'
import type { WelcomeAudioConfig } from '@/lib/audio/welcome-audio-sequencer'
import { CLASSROOM_BRAND } from '@/lib/constants/classroom-brand'
import { UI_LAYER_MATRIX } from '@/lib/constants/ui-layer-matrix'
import { memo, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './WelcomeScreen.css'
import './WelcomeScreen.motion.css'

interface WelcomeScreenProps {
  onComplete: () => void
  /** Optional custom audio configuration */
  audioConfig?: Partial<WelcomeAudioConfig>
}

export const WelcomeScreen = memo(({ onComplete, audioConfig }: WelcomeScreenProps) => {
  const { t } = useTranslation()
  const { gameplayLanguage } = useSettings()
  const videoRef = useRef<HTMLVideoElement>(null)
  const welcomeAudioConfig = useMemo(
    () => ({ ...audioConfig, language: gameplayLanguage }),
    [audioConfig, gameplayLanguage],
  )
  const {
    fadeOut,
    phase,
    isSequencePlaying,
    showFallbackImage,
    currentAudioIndex,
    totalAudioCount,
    lastDiagnostic,
    handlePrimaryAction,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
  } = useWelcomeSequence({ onComplete, audioConfig: welcomeAudioConfig })

  const videoSrc = '/New_welcome_video.mp4'
  const fallbackImageSrc = '/welcome-sangsom.png'
  const interactionLocked = isWelcomeInteractionLocked(phase)
  const shouldLoadVideo = isSequencePlaying || showFallbackImage

  useEffect(() => {
    if (!shouldLoadVideo) {
      return
    }

    const video = videoRef.current
    if (!video || !video.paused) {
      return
    }

    void video.play().catch(() => {
      // Ignore autoplay interruptions; the welcome flow remains usable.
    })
  }, [shouldLoadVideo])

  const actionLabel = (() => {
    if (phase === 'playingNarration') {
      return t('welcome.listening', { defaultValue: 'Listening...' })
    }

    if (phase === 'readyToContinue') {
      return t('menu.tapToContinue')
    }

    if (phase === 'transitioningToMenu') {
      return t('welcome.transitioning', { defaultValue: 'Opening menu...' })
    }

    return t('menu.tapToStart')
  })()

  const statusLabel = (() => {
    if (phase === 'playingNarration') {
      return t('welcome.listeningHint', {
        defaultValue: 'Please wait for the welcome audio',
      })
    }

    if (phase === 'readyToContinue') {
      return t('welcome.readyContinue', { defaultValue: 'Ready to continue' })
    }

    if (phase === 'transitioningToMenu') {
      return t('welcome.transitioning', { defaultValue: 'Opening menu...' })
    }

    return t('welcome.readyPrompt', { defaultValue: 'Tap once to begin' })
  })()

  const diagnosticLabel =
    lastDiagnostic?.type === 'thai-voice-unavailable'
      ? t('welcome.thaiVoiceUnavailable', {
        defaultValue:
          'Thai welcome voice unavailable on this device, continuing silently.',
      })
      : null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      data-testid="welcome-screen"
      data-welcome-phase={phase}
      aria-busy={interactionLocked}
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
        background: CLASSROOM_BRAND.palette.ink,
        zIndex: UI_LAYER_MATRIX.WELCOME_OVERLAY,
      }}
      onClick={handlePrimaryAction}
    >
      <div className="welcome-stage" aria-hidden="true" />

      <video
        ref={videoRef}
        className="welcome-video"
        src={shouldLoadVideo ? videoSrc : undefined}
        autoPlay={shouldLoadVideo}
        muted
        playsInline
        preload={shouldLoadVideo ? 'metadata' : 'none'}
        onCanPlay={handleVideoCanPlay}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        data-testid="welcome-video"
      />

      {showFallbackImage && (
        <img
          src={fallbackImageSrc}
          alt={t('game.title')}
          className={`absolute inset-0 h-full w-full object-cover pointer-events-none ${showFallbackImage ? 'welcome-fallback-pop' : ''}`}
          style={{ zIndex: UI_LAYER_MATRIX.GAMEPLAY_EFFECTS }}
          data-testid="welcome-screen-fallback"
          aria-hidden="true"
        />
      )}

      <div className="welcome-scrim" aria-hidden="true" />
      <div className="welcome-panels">
        <WelcomeLanguageShell disabled={phase !== 'readyToStart'} />
        <WelcomeStatusPanel
          actionLabel={actionLabel}
          statusLabel={statusLabel}
          phase={phase}
          interactionLocked={interactionLocked}
          isSequencePlaying={isSequencePlaying}
          currentAudioIndex={currentAudioIndex}
          totalAudioCount={totalAudioCount}
          diagnosticLabel={diagnosticLabel}
          onPrimaryAction={handlePrimaryAction}
        />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
