import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider, useSettings } from '../settings-context'

const mockState = vi.hoisted(() => ({
  setVolume: vi.fn(),
  setEnabled: vi.fn(),
  hasLanguageAudioPrefetchKeys: vi.fn(() => false),
  prefetchSelectedLanguageAudioPack: vi.fn(async () => undefined),
}))

vi.mock('../../lib/sound-manager', () => ({
  soundManager: {
    setVolume: mockState.setVolume,
    setEnabled: mockState.setEnabled,
  },
}))

vi.mock('../../app/startup/language-audio-prefetch', () => ({
  hasLanguageAudioPrefetchKeys: mockState.hasLanguageAudioPrefetchKeys,
  prefetchSelectedLanguageAudioPack: mockState.prefetchSelectedLanguageAudioPack,
}))

function ThemeProbe() {
  const { setTheme } = useSettings()

  return (
    <button type="button" onClick={() => setTheme('dark')}>
      activate dark theme
    </button>
  )
}

describe('SettingsProvider theme classes', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    document.body.innerHTML = ''
    document.documentElement.className = ''
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('applies the active dark token class to the document root', async () => {
    await act(async () => {
      root.render(
        <SettingsProvider>
          <ThemeProbe />
        </SettingsProvider>,
      )
    })

    const trigger = document.querySelector('button') as HTMLButtonElement

    await act(async () => {
      trigger.click()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})