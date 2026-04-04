import { WelcomeLanguageShell } from '@/components/welcome/WelcomeLanguageShell'
import { WelcomeStatusPanel } from '@/components/welcome/WelcomeStatusPanel'
import { useWelcomeSequence } from '@/components/welcome/use-welcome-sequence'
import { isWelcomeInteractionLocked } from '@/components/welcome/welcome-phase'
import {
  hasCompletedStartupLanguageGate,
  markStartupLanguageGateCompleted,
} from '@/app/startup/startup-persistence'
import { useSettings } from '@/context/settings-context'
import type { WelcomeAudioConfig } from '@/lib/audio/welcome-audio-sequencer'
import { CLASSROOM_BRAND } from '@/lib/constants/classroom-brand'
import { UI_LAYER_MATRIX } from '@/lib/constants/ui-layer-matrix'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './WelcomeScreen.adaptive.css'
import './WelcomeScreen.controls.css'
import './WelcomeScreen.css'
import './WelcomeScreen.dock.css'
import './WelcomeScreen.motion.css'
import './WelcomeScreen.ultrawide.css'

interface WelcomeScreenProps {
  onComplete: () => void
  /** Optional custom audio configuration */
  audioConfig?: Partial<WelcomeAudioConfig>
}

export const WelcomeScreen = memo(({ onComplete, audioConfig }: WelcomeScreenProps) => {
  const { t } = useTranslation()
  const { gameplayLanguage } = useSettings()
  const [isLanguageShellVisible, setIsLanguageShellVisible] = useState(
    () => !hasCompletedStartupLanguageGate(),
  )
  const primaryButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestorePrimaryFocusRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const skipAutoplayEffectRef = useRef(false)
  const welcomeAudioConfig = useMemo(() => ({ ...audioConfig, language: gameplayLanguage }), [audioConfig, gameplayLanguage])
  const {
    fadeOut,
    phase,
    isSequencePlaying,
    showFallbackImage,
    currentAudioIndex,
    totalAudioCount,
    lastDiagnostic,
    handleIntroActivated,
    handlePrimaryAction,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
    handleVideoPlaying,
  } = useWelcomeSequence({ onComplete, audioConfig: welcomeAudioConfig })

  const videoSrc = '/New_welcome_video.mp4'
  const fallbackImageSrc = '/welcome-sangsom.png'
  const interactionLocked = isWelcomeInteractionLocked(phase)
  const shouldLoadVideo = !isLanguageShellVisible && !showFallbackImage

  useEffect(() => {
    if (!shouldLoadVideo) return
    if (skipAutoplayEffectRef.current) {
      skipAutoplayEffectRef.current = false
      return
    }
    const video = videoRef.current
    if (!video || !video.paused) return
    try {
      const playAttempt = video.play()
      if (typeof playAttempt?.catch === 'function') {
        void playAttempt.catch(() => {
          handleVideoError()
        })
      }
    } catch {
      handleVideoError()
    }
  }, [handleVideoError, shouldLoadVideo])

  useLayoutEffect(() => {
    if (isLanguageShellVisible || !shouldRestorePrimaryFocusRef.current) {
      return
    }
    if (!primaryButtonRef.current?.disabled) {
      primaryButtonRef.current?.focus()
    }
    shouldRestorePrimaryFocusRef.current = false
  }, [isLanguageShellVisible])

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
  const shouldShowStatusPanel = !showFallbackImage && (isLanguageShellVisible || phase === 'readyToContinue' || phase === 'transitioningToMenu' || Boolean(diagnosticLabel))

  const handleLanguageSelected = (shouldRestoreFocus: boolean) => {
    shouldRestorePrimaryFocusRef.current = shouldRestoreFocus
    const video = videoRef.current
    if (video && !video.getAttribute('src')) {
      video.src = videoSrc
      video.preload = 'metadata'
      skipAutoplayEffectRef.current = true
    }
    markStartupLanguageGateCompleted()
    handleIntroActivated(video)
    setIsLanguageShellVisible(false)
  }

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
      onClick={isLanguageShellVisible ? undefined : handlePrimaryAction}
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
        onPlaying={handleVideoPlaying}
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
      <div
        className={`welcome-panels ${isLanguageShellVisible ? '' : 'welcome-panels--language-hidden'}`.trim()}
      >
        {isLanguageShellVisible ? (
          <WelcomeLanguageShell
            disabled={phase !== 'readyToStart'}
            onLanguageSelected={handleLanguageSelected}
          />
        ) : null}
        {shouldShowStatusPanel ? (
          <WelcomeStatusPanel
            actionLabel={actionLabel}
            statusLabel={statusLabel}
            phase={phase}
            interactionLocked={interactionLocked || isLanguageShellVisible}
            isSequencePlaying={isSequencePlaying}
            currentAudioIndex={currentAudioIndex}
            totalAudioCount={totalAudioCount}
            diagnosticLabel={diagnosticLabel}
            onPrimaryAction={handlePrimaryAction}
            primaryButtonRef={primaryButtonRef}
          />
        ) : null}
      </div>
    </div>
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
