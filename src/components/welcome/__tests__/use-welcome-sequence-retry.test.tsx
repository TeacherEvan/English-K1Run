import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { capturedState, mockRequestStart, mockMarkReadyToContinue } = vi.hoisted(() => ({
  capturedState: { current: null as ReturnType<typeof useWelcomeSequence> | null },
  mockRequestStart: vi.fn(),
  mockMarkReadyToContinue: vi.fn(),
}))

vi.mock('@/components/welcome/use-welcome-audio-sequence', () => ({
  useWelcomeAudioSequence: () => ({
    readyToContinue: false,
    isSequencePlaying: false,
    currentAudioIndex: 0,
    totalAudioCount: 0,
    lastDiagnostic: null,
    requestStart: mockRequestStart,
    markReadyToContinue: mockMarkReadyToContinue,
  }),
}))

import { useWelcomeSequence } from '../use-welcome-sequence'

const Harness = () => {
  const state = useWelcomeSequence({ onComplete: () => { } })

  useEffect(() => {
    capturedState.current = state
  }, [state])

  return null
}

describe('useWelcomeSequence retry flow', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    capturedState.current = null
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.clearAllMocks()
  })

  it('surfaces a retry prompt after an AbortError interruption', async () => {
    await act(async () => {
      root.render(<Harness />)
    })

    const video = document.createElement('video')
    Object.defineProperty(video, 'play', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException('interrupted', 'AbortError')),
    })

    await act(async () => {
      capturedState.current?.handleIntroActivated(video)
      await Promise.resolve()
    })

    expect(capturedState.current?.showRetryPrompt).toBe(true)
    expect(mockMarkReadyToContinue).not.toHaveBeenCalled()
  })

  it('clears the retry prompt after an explicit retry succeeds', async () => {
    await act(async () => {
      root.render(<Harness />)
    })

    const play = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('interrupted', 'AbortError'))
      .mockResolvedValueOnce(undefined)
    const video = document.createElement('video')
    Object.defineProperty(video, 'play', { configurable: true, value: play })

    await act(async () => {
      capturedState.current?.handleIntroActivated(video)
      await Promise.resolve()
    })

    await act(async () => {
      capturedState.current?.handlePrimaryAction(video)
      await Promise.resolve()
    })

    expect(play).toHaveBeenCalledTimes(2)
    expect(capturedState.current?.showRetryPrompt).toBe(false)
  })
})