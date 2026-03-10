import { useWelcomeSequence } from '@/components/welcome/use-welcome-sequence'
import type { WelcomeAudioConfig } from '@/lib/audio/welcome-audio-sequencer'
import { UI_LAYER_MATRIX } from '@/lib/constants/ui-layer-matrix'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onComplete: () => void
  /** Optional custom audio configuration */
  audioConfig?: Partial<WelcomeAudioConfig>
}

export const WelcomeScreen = memo(({ onComplete, audioConfig }: WelcomeScreenProps) => {
  const { t } = useTranslation()
  const {
    fadeOut,
    readyToContinue,
    isSequencePlaying,
    videoLoaded,
    showFallbackImage,
    currentAudioIndex,
    totalAudioCount,
    handlePrimaryAction,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
  } = useWelcomeSequence({ onComplete, audioConfig })

  const videoSrc = '/New_welcome_video.mp4'
  const fallbackImageSrc = '/welcome-sangsom.png'
  const actionLabel = readyToContinue ? t('menu.tapToContinue') : t('menu.tapToStart')

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      data-testid="welcome-screen"
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
        background: '#000',
        zIndex: UI_LAYER_MATRIX.WELCOME_OVERLAY,
      }}
      onClick={handlePrimaryAction}
    >
      {/* Video Background - Full Screen with autoplay */}
      <video
        className="welcome-video"
        src={videoSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={handleVideoCanPlay}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        poster={fallbackImageSrc}
        data-testid="welcome-video"
      />

      {/* Fallback static image if video fails to load */}
      {(!videoLoaded || showFallbackImage) && (
        <>
          <img
            src={fallbackImageSrc}
            alt={t('game.title')}
            className={`absolute inset-0 w-full h-full object-cover ${showFallbackImage ? 'welcome-fallback-pop' : ''}`}
            style={{ zIndex: UI_LAYER_MATRIX.GAMEPLAY_EFFECTS }}
            data-testid="welcome-screen-fallback"
          />
        </>
      )}

      <div className="welcome-image-overlay">
        <button
          type="button"
          className="welcome-image-button"
          onClick={(event) => {
            event.stopPropagation()
            handlePrimaryAction()
          }}
          data-testid="welcome-primary-button"
        >
          <span className="welcome-image-text" role="status" aria-live="polite">
            {actionLabel}
          </span>
        </button>
      </div>

      {/* Audio progress indicator (subtle) */}
      {isSequencePlaying && totalAudioCount > 0 && (
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          style={{ zIndex: UI_LAYER_MATRIX.HUD_SECONDARY }}
        >
          <div className="flex gap-2">
            {Array.from({ length: totalAudioCount }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < currentAudioIndex ? 'bg-green-400' :
                  i === currentAudioIndex ? 'bg-yellow-400 animate-pulse' :
                    'bg-white/30'
                  }`}
                data-testid={`audio-progress-${i}`}
              />
            ))}
          </div>
        </div>
      )}

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
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
