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
        handleIntroActivated?: () => void
        handlePrimaryAction: () => void
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

    it('does not start audio before the video is actually playing', async () => {
        await act(async () => {
            root.render(<Harness />)
        })

        await act(async () => {
            capturedStates[0].handleIntroActivated?.()
            capturedStates[0].handlePrimaryAction()
        })

        expect(mockRequestStart).not.toHaveBeenCalled()

        await act(async () => {
            capturedStates[0].handleVideoPlaying?.()
        })

        expect(mockRequestStart).toHaveBeenCalledTimes(1)
    })

    it('marks ready to continue and never starts audio when the video fails', async () => {
        await act(async () => {
            root.render(<Harness />)
        })

        await act(async () => {
            capturedStates[0].handleIntroActivated?.()
            capturedStates[0].handleVideoError()
        })

        expect(mockRequestStart).not.toHaveBeenCalled()
        expect(mockMarkReadyToContinue).toHaveBeenCalledTimes(1)
        expect(capturedStates[0].showFallbackImage).toBe(true)
    })
})
