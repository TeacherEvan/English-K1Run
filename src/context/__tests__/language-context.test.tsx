import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageProvider } from '../language-context'

const mockState = vi.hoisted(() => ({
  changeLanguage: vi.fn(async () => undefined),
  trackLanguageChange: vi.fn(),
  setDisplayLanguage: vi.fn(),
  soundManagerLanguage: 'en',
  settingsState: {
    displayLanguage: 'en',
    gameplayLanguage: 'en',
    setDisplayLanguage: vi.fn(),
  },
}))

vi.mock('../../i18n', () => ({
  default: {
    changeLanguage: mockState.changeLanguage,
  },
}))

vi.mock('../../lib/event-tracker', () => ({
  eventTracker: {
    trackLanguageChange: mockState.trackLanguageChange,
  },
}))

vi.mock('../../lib/sound-manager', () => ({
  soundManager: {
    setLanguage: vi.fn((lang: string) => {
      mockState.soundManagerLanguage = lang
    }),
    getLanguage: vi.fn(() => mockState.soundManagerLanguage),
  },
}))

vi.mock('../settings-context', () => ({
  useSettings: () => mockState.settingsState,
}))

describe('LanguageProvider', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    localStorage.clear()
    mockState.soundManagerLanguage = 'en'
    mockState.settingsState = {
      displayLanguage: 'en',
      gameplayLanguage: 'en',
      setDisplayLanguage: mockState.setDisplayLanguage,
    }
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    document.body.innerHTML = ''
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('syncs gameplay language to the sound manager singleton', async () => {
    mockState.settingsState = {
      ...mockState.settingsState,
      gameplayLanguage: 'fr',
    }

    await act(async () => {
      root.render(
        <LanguageProvider>
          <div>language test</div>
        </LanguageProvider>,
      )
    })

    const { soundManager } = await import('../../lib/sound-manager')
    expect(soundManager.setLanguage).toHaveBeenLastCalledWith('fr')
    expect(soundManager.getLanguage()).toBe('fr')

    mockState.settingsState = {
      ...mockState.settingsState,
      gameplayLanguage: 'ja',
    }

    await act(async () => {
      root.render(
        <LanguageProvider>
          <div>language test</div>
        </LanguageProvider>,
      )
    })

    expect(soundManager.setLanguage).toHaveBeenLastCalledWith('ja')
    expect(soundManager.getLanguage()).toBe('ja')
  })
})