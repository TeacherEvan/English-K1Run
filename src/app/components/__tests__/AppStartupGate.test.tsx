import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../components/WelcomeScreen', () => ({
  WelcomeScreen: ({ onComplete }: { onComplete: () => void }) => (
    <button data-testid="welcome-screen" onClick={onComplete} type="button" />
  ),
}))

vi.mock('../../../components/worm-loading', () => ({
  WormLoadingScreen: ({ onComplete }: { onComplete: () => void }) => (
    <button data-testid="worm-loading-screen" onClick={onComplete} type="button" />
  ),
}))

import { AppStartupGate } from '../AppStartupGate'

describe('AppStartupGate', () => {
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
    vi.clearAllMocks()
  })

  it('renders the startup loading screen during boot', async () => {
    await act(async () => {
      root.render(
        <AppStartupGate
          startupStep="boot"
          isLoading={false}
          onWelcomeComplete={() => {}}
          onLoadingComplete={() => {}}
        />,
      )
    })

    expect(
      document.querySelector('[data-testid="startup-loading-screen"]'),
    ).not.toBeNull()
  })

  it('renders the welcome screen after boot completes', async () => {
    await act(async () => {
      root.render(
        <AppStartupGate
          startupStep="welcome"
          isLoading={false}
          onWelcomeComplete={() => {}}
          onLoadingComplete={() => {}}
        />,
      )
      await Promise.resolve()
    })

    expect(document.querySelector('[data-testid="welcome-screen"]')).not.toBeNull()
  })

  it('renders worm loading only for post-menu game loading', async () => {
    await act(async () => {
      root.render(
        <AppStartupGate
          startupStep="menu"
          isLoading={true}
          onWelcomeComplete={() => {}}
          onLoadingComplete={() => {}}
        />,
      )
      await Promise.resolve()
    })

    expect(
      document.querySelector('[data-testid="worm-loading-screen"]'),
    ).not.toBeNull()
  })
})
