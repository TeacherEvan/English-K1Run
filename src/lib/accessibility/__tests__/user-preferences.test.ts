import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  userPrefersDarkMode,
  userPrefersHighContrast,
  userPrefersReducedData,
  userPrefersReducedMotion,
} from '../user-preferences'

describe('user preferences', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    })
  })

  it('returns false when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    })

    expect(userPrefersReducedMotion()).toBe(false)
    expect(userPrefersReducedData()).toBe(false)
    expect(userPrefersDarkMode()).toBe(false)
    expect(userPrefersHighContrast()).toBe(false)
  })

  it('reads the expected media queries', () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia,
    })

    expect(userPrefersReducedMotion()).toBe(true)
    expect(userPrefersReducedData()).toBe(false)
    expect(userPrefersDarkMode()).toBe(false)
    expect(userPrefersHighContrast()).toBe(false)
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-data: reduce)')
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)')
  })
})
