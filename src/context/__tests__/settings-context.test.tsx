import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsProvider, useSettings } from '../settings-context'

vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    setVolume: vi.fn(),
    setEnabled: vi.fn(),
  },
}))

const SettingsProbe = () => {
  const settings = useSettings()

  return (
    <div data-reduced-motion={settings.reducedMotion ? 'on' : 'off'}>
      settings
    </div>
  )
}

describe('SettingsProvider', () => {
  let container: HTMLDivElement
  let root: Root
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    document.body.innerHTML = ''
    localStorage.clear()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    })
  })

  it('defaults reduced motion from the system preference when nothing is stored', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    act(() => {
      root.render(
        <SettingsProvider>
          <SettingsProbe />
        </SettingsProvider>,
      )
    })

    expect(container.querySelector('[data-reduced-motion="on"]')).not.toBeNull()
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(
      true,
    )
  })

  it('preserves an explicitly stored reduced motion setting', () => {
    localStorage.setItem(
      'k1-settings',
      JSON.stringify({
        reducedMotion: false,
      }),
    )

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    act(() => {
      root.render(
        <SettingsProvider>
          <SettingsProbe />
        </SettingsProvider>,
      )
    })

    expect(container.querySelector('[data-reduced-motion="off"]')).not.toBeNull()
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(
      false,
    )
  })
})
