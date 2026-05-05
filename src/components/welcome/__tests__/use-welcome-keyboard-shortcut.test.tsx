import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWelcomeKeyboardShortcut } from '../use-welcome-keyboard-shortcut'
import type { WelcomePhase } from '../welcome-phase'

interface HarnessProps {
  isE2E?: boolean
  onPrimaryAction: () => void
  phase: WelcomePhase
}

const Harness = ({ isE2E = false, onPrimaryAction, phase }: HarnessProps) => {
  useWelcomeKeyboardShortcut({ handlePrimaryAction: onPrimaryAction, isE2E, phase })

  useEffect(() => undefined, [])
  return null
}

describe('useWelcomeKeyboardShortcut', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
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
    vi.clearAllMocks()
  })

  it('starts the welcome flow from the keyboard in readyToStart', async () => {
    const onPrimaryAction = vi.fn()

    await act(async () => {
      root.render(<Harness onPrimaryAction={onPrimaryAction} phase="readyToStart" />)
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }))

    expect(onPrimaryAction).toHaveBeenCalledTimes(1)
  })

  it('keeps keyboard actions blocked while narration is playing', async () => {
    const onPrimaryAction = vi.fn()

    await act(async () => {
      root.render(
        <Harness onPrimaryAction={onPrimaryAction} phase="playingNarration" />,
      )
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }))

    expect(onPrimaryAction).not.toHaveBeenCalled()
  })

  it('allows keyboard continuation after narration completes', async () => {
    const onPrimaryAction = vi.fn()

    await act(async () => {
      root.render(
        <Harness onPrimaryAction={onPrimaryAction} phase="readyToContinue" />,
      )
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }))

    expect(onPrimaryAction).toHaveBeenCalledTimes(1)
  })

  it('does not treat Escape as a primary startup action', async () => {
    const onPrimaryAction = vi.fn()

    await act(async () => {
      root.render(<Harness onPrimaryAction={onPrimaryAction} phase="readyToStart" />)
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))

    expect(onPrimaryAction).not.toHaveBeenCalled()
  })
})