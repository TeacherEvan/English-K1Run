import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FallingObject } from '../FallingObject'

describe('FallingObject', () => {
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

  it('supports keyboard activation for gameplay targets', () => {
    const onTap = vi.fn()

    act(() => {
      root.render(
        <FallingObject
          object={{
            id: 'target-1',
            type: 'target',
            emoji: '🐱',
            x: 40,
            y: 120,
            speed: 1,
            size: 60,
            lane: 'left',
          }}
          onTap={onTap}
          playerSide="left"
        />,
      )
    })

    const object = document.querySelector('[data-testid="falling-object"]') as HTMLElement | null
    expect(object).not.toBeNull()
    expect(object?.getAttribute('role')).toBe('button')
    expect(object?.getAttribute('tabindex')).toBe('0')

    act(() => {
      object?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(onTap).toHaveBeenCalledWith('target-1', 'left')
  })
})