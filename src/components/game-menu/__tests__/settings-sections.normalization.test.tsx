import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccessibilitySettings } from '../settings-sections/AccessibilitySettings'
import { AudioSettings } from '../settings-sections/AudioSettings'

const mockSettings = vi.hoisted(() => ({
  volume: 0.6,
  soundEnabled: true,
  setVolume: vi.fn(),
  setSoundEnabled: vi.fn(),
  highContrast: false,
  reducedMotion: false,
  setHighContrast: vi.fn(),
  setReducedMotion: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../../context/settings-context', () => ({
  useSettings: () => mockSettings,
}))

vi.mock('../../../lib/audio/audio-accessibility', () => ({
  isAudioDescriptionsEnabled: () => false,
  setAudioDescriptionsEnabled: vi.fn(),
}))

describe('settings section normalization', () => {
  let container: HTMLDivElement
  let root: Root
  let originalResizeObserver: typeof globalThis.ResizeObserver | undefined

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as typeof ResizeObserver
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
    if (originalResizeObserver) {
      globalThis.ResizeObserver = originalResizeObserver
    } else {
      Reflect.deleteProperty(globalThis, 'ResizeObserver')
    }
    vi.clearAllMocks()
  })

  it('renders audio settings inside the branded menu surface with touch-sized controls', async () => {
    await act(async () => {
      root.render(<AudioSettings />)
    })

    const surface = Array.from(container.querySelectorAll('div')).find((element) =>
      element.className.includes('rounded-[1.65rem]'),
    )
    const button = container.querySelector('button') as HTMLButtonElement

    expect(surface).toBeTruthy()
    expect(button.className.includes('min-h-12')).toBe(true)
  })

  it('renders accessibility settings inside the branded menu surface with touch-sized controls', async () => {
    await act(async () => {
      root.render(<AccessibilitySettings />)
    })

    const surface = Array.from(container.querySelectorAll('div')).find((element) =>
      element.className.includes('rounded-[1.65rem]'),
    )
    const buttons = Array.from(container.querySelectorAll('button'))

    expect(surface).toBeTruthy()
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons.every((button) => button.className.includes('min-h-12'))).toBe(true)
  })
})