import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { WelcomeStatusPanel } from '../WelcomeStatusPanel'

describe('WelcomeStatusPanel', () => {
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
  })

  it('renders a Thai voice fallback diagnostic when provided', () => {
    act(() => {
      root.render(
        <WelcomeStatusPanel
          actionLabel="Tap to continue"
          statusLabel="Please wait for the welcome audio"
          diagnosticLabel="Thai welcome voice unavailable on this device, continuing silently."
          phase="playingNarration"
          interactionLocked
          isSequencePlaying={false}
          currentAudioIndex={0}
          totalAudioCount={0}
          onPrimaryAction={() => {}}
        />,
      )
    })

    expect(
      document.querySelector('[data-testid="welcome-diagnostic-label"]')
        ?.textContent,
    ).toContain('Thai welcome voice unavailable on this device')
  })
})