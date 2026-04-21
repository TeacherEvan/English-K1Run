import React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageSelector } from '../language-selector'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'settings.controls.displayLanguageTitle': 'Display language',
      'settings.controls.gameplayLanguageTitle': 'Gameplay language',
      'settings.controls.displayLanguageDescription': 'Choose the menu language.',
      'settings.controls.gameplayLanguageDescription': 'Choose the in-game language.',
      'settings.controls.selectDisplayLanguage': 'Select display language',
      'settings.controls.selectGameplayLanguage': 'Select gameplay language',
      'settings.controls.languageGroupLabel': 'Languages',
    }[key] ?? key),
  }),
}))

vi.mock('@/hooks/use-language', () => ({
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
  }),
}))

vi.mock('@/context/settings-context', () => ({
  useSettings: () => ({
    gameplayLanguage: 'th',
    setGameplayLanguage: vi.fn(),
  }),
}))

vi.mock('@radix-ui/react-select', () => {
  type MockProps = { children?: React.ReactNode } & Record<string, unknown>
  const cleanProps = ({ asChild: _asChild, position: _position, sideOffset: _sideOffset, ...props }: MockProps) => props
  const passthrough = (tag = 'div') => ({ children, ...props }: MockProps) =>
    React.createElement(tag, cleanProps(props), children)
  const Trigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    ({ children, ...props }, ref) =>
      React.createElement('button', { ...cleanProps(props), ref, type: 'button' }, children),
  )
  return {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Trigger,
    Value: passthrough('span'),
    Icon: passthrough('span'),
    Portal: passthrough(),
    Content: passthrough(),
    Viewport: passthrough(),
    Group: passthrough(),
    Label: passthrough(),
    Item: passthrough(),
    ItemIndicator: passthrough('span'),
    ScrollDownButton: passthrough(),
  }
})

describe('LanguageSelector spotlight styling', () => {
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
    document.body.innerHTML = ''
  })

  it('marks gameplay selectors and option rows with spotlight attributes', async () => {
    await act(async () => {
      root.render(<LanguageSelector highlightVariant="spotlight" languageType="gameplay" />)
    })

    const shell = document.querySelector('.language-selector-shell') as HTMLDivElement
    const trigger = document.querySelector('[aria-label="Select gameplay language"]') as HTMLButtonElement
    const options = document.querySelectorAll('[data-language-option-highlight="spotlight"]')

    expect(shell.dataset.languageHighlight).toBe('spotlight')
    expect(trigger.dataset.languageHighlight).toBe('spotlight')
    expect(options.length).toBeGreaterThan(1)
  })

  it('marks display selectors and option rows with sibling attributes', async () => {
    await act(async () => {
      root.render(<LanguageSelector highlightVariant="sibling" languageType="display" />)
    })

    const shell = document.querySelector('.language-selector-shell') as HTMLDivElement
    const trigger = document.querySelector('[aria-label="Select display language"]') as HTMLButtonElement
    const options = document.querySelectorAll('[data-language-option-highlight="sibling"]')

    expect(shell.dataset.languageHighlight).toBe('sibling')
    expect(trigger.dataset.languageHighlight).toBe('sibling')
    expect(options.length).toBeGreaterThan(1)
  })
})
