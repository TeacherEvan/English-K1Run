import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
    capturedStates,
    mockCaptureState,
    mockMarkReadyToContinue,
    mockRequestStart,
} = vi.hoisted(() => ({
    capturedStates: [] as Array<{
        handleIntroActivated?: (video?: HTMLVideoElement | null) => void
        handlePrimaryAction: (video?: HTMLVideoElement | null) => void
        handleVideoError: () => void
        handleVideoPlaying?: () => void
        showFallbackImage: boolean
    }>,
    mockCaptureState: vi.fn(),
    mockMarkReadyToContinue: vi.fn(),
    mockRequestStart: vi.fn(),
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
        mockCaptureState(state)
    }, [state])

    return null
}

describe('useWelcomeSequence', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        capturedStates.length = 0
        mockCaptureState.mockImplementation((state) => {
            capturedStates[0] = state
        })
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
        vi.clearAllMocks()
    })

    it('arms intro audio on language selection and starts it only after video playing', async () => {
        await act(async () => {
            root.render(<Harness />)
        })

        const video = document.createElement('video')
        Object.defineProperty(video, 'play', {
            configurable: true,
            value: vi.fn().mockResolvedValue(undefined),
        })

        await act(async () => {
            capturedStates[0].handleIntroActivated?.(video)
        })

        expect(mockRequestStart).not.toHaveBeenCalled()

        await act(async () => {
            capturedStates[0].handleVideoPlaying?.()
        })

        expect(mockRequestStart).toHaveBeenCalledTimes(1)
    })

    it('does not start intro audio from the video playing event before an explicit activation', async () => {
        await act(async () => {
            root.render(<Harness />)
        })

        await act(async () => {
            capturedStates[0].handleVideoPlaying?.()
        })

        expect(mockRequestStart).not.toHaveBeenCalled()
    })

    it('primes repeat-launch intro playback without starting audio until video playing', async () => {
        await act(async () => {
            root.render(<Harness />)
        })

        const video = document.createElement('video')
        Object.defineProperty(video, 'play', {
            configurable: true,
            value: vi.fn().mockResolvedValue(undefined),
        })

        await act(async () => {
            capturedStates[0].handlePrimaryAction(video)
        })

        expect(mockRequestStart).not.toHaveBeenCalled()

        await act(async () => {
            capturedStates[0].handleVideoPlaying?.()
        })

        expect(mockRequestStart).toHaveBeenCalledTimes(1)
    })

    it('marks ready to continue without starting audio when the video fails before playing', async () => {
        await act(async () => {
            root.render(<Harness />)
        })

        const video = document.createElement('video')
        Object.defineProperty(video, 'play', {
            configurable: true,
            value: vi.fn().mockResolvedValue(undefined),
        })

        await act(async () => {
            capturedStates[0].handleIntroActivated?.(video)
            capturedStates[0].handleVideoError()
        })

        expect(mockRequestStart).not.toHaveBeenCalled()
        expect(mockMarkReadyToContinue).toHaveBeenCalledTimes(1)
        expect(capturedStates[0].showFallbackImage).toBe(true)
    })
})
