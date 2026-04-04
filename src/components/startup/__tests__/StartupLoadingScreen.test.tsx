import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { StartupLoadingScreen } from '../StartupLoadingScreen'

describe('StartupLoadingScreen', () => {
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
  })

  it('renders the branded background and progress bar', async () => {
    await act(async () => {
      root.render(
        <StartupLoadingScreen
          percentage={42}
          phase="introReady"
          label="Preparing intro"
        />,
      )
    })

    expect(
      document.querySelector('[data-testid="startup-loading-screen"]'),
    ).not.toBeNull()
    expect(
      document.querySelector('[data-testid="startup-loading-background"]'),
    ).not.toBeNull()

    const progress = document.querySelector('[role="progressbar"]')
    expect(progress?.getAttribute('aria-valuenow')).toBe('42')
  })
})
