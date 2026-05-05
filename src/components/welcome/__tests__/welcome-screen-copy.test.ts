import { describe, expect, it } from 'vitest'

import {
  getWelcomeActionLabel,
  getWelcomeStatusLabel,
  shouldShowWelcomeStatusPanel,
} from '../welcome-screen-copy'

const t = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key

describe('welcome-screen-copy', () => {
  it('maps each welcome phase to the expected primary action label', () => {
    expect(getWelcomeActionLabel(t, 'readyToStart')).toBe('menu.tapToStart')
    expect(getWelcomeActionLabel(t, 'playingNarration')).toBe('Listening...')
    expect(getWelcomeActionLabel(t, 'readyToContinue')).toBe('menu.tapToContinue')
    expect(getWelcomeActionLabel(t, 'transitioningToMenu')).toBe('Opening menu...')
  })

  it('maps each welcome phase to the expected status label', () => {
    expect(getWelcomeStatusLabel(t, 'readyToStart')).toBe('Tap once to begin')
    expect(getWelcomeStatusLabel(t, 'playingNarration')).toBe(
      'Please wait for the welcome audio',
    )
    expect(getWelcomeStatusLabel(t, 'readyToContinue')).toBe('Ready to continue')
    expect(getWelcomeStatusLabel(t, 'transitioningToMenu')).toBe('Opening menu...')
  })

  it('keeps the status panel visible while narration is playing', () => {
    expect(
      shouldShowWelcomeStatusPanel({
        diagnosticLabel: null,
        isLanguageShellVisible: false,
        phase: 'playingNarration',
        showFallbackImage: false,
        showIntroStartPrompt: false,
      }),
    ).toBe(true)
  })

  it('hides the status panel on the fallback-image path without diagnostics', () => {
    expect(
      shouldShowWelcomeStatusPanel({
        diagnosticLabel: null,
        isLanguageShellVisible: false,
        phase: 'readyToContinue',
        showFallbackImage: true,
        showIntroStartPrompt: false,
      }),
    ).toBe(false)
  })
})