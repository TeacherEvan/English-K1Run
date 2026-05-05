import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Worm } from '../Worm'

describe('Worm', () => {
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

  it('supports keyboard activation for gameplay worms', () => {
    const onTap = vi.fn()

    act(() => {
      root.render(
        <Worm
          worm={{
            id: 'worm-1',
            x: 40,
            y: 120,
            vx: 0,
            vy: 1,
            angle: 0,
            wigglePhase: 0,
            alive: true,
            lane: 'left',
          }}
          onTap={onTap}
          playerSide="left"
        />,
      )
    })

    const worm = document.querySelector('[data-testid="worm"]') as HTMLElement | null
    expect(worm).not.toBeNull()
    expect(worm?.getAttribute('role')).toBe('button')
    expect(worm?.getAttribute('tabindex')).toBe('0')

    act(() => {
      worm?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(onTap).toHaveBeenCalledWith('worm-1', 'left')
  })
})