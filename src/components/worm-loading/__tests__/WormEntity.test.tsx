import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WormEntity } from '../WormEntity'

describe('WormEntity', () => {
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

  it('supports keyboard activation on loading worms', () => {
    const onWormClick = vi.fn()

    act(() => {
      root.render(
        <WormEntity
          worm={{
            id: 7,
            x: 30,
            y: 45,
            vx: 0,
            vy: 1,
            angle: 0,
            alive: true,
            wigglePhase: 0,
          }}
          onWormClick={onWormClick}
        />,
      )
    })

    const worm = document.querySelector('[data-testid="worm-target"]') as HTMLElement | null
    expect(worm).not.toBeNull()
    expect(worm?.getAttribute('role')).toBe('button')
    expect(worm?.getAttribute('tabindex')).toBe('0')

    act(() => {
      worm?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })

    expect(onWormClick).toHaveBeenCalledTimes(1)
    expect(onWormClick.mock.calls[0]?.[0]).toBe(7)
  })
})