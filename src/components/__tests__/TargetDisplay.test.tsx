import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TargetDisplay } from '../TargetDisplay'

vi.mock('../../context/settings-context', () => ({
    useSettings: () => ({
        gameplayLanguage: 'ja',
        displayLanguage: 'en',
    }),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { lng?: string }) => {
            const language = options?.lng ?? 'en'
            const translations: Record<string, Record<string, string>> = {
                en: {
                    'categories.animals': 'Animals & Nature',
                    'game.find': 'Find',
                    'game.inOrder': 'In order',
                },
                ja: {
                    'categories.animals': '動物と自然',
                    'game.find': '見つけよう',
                    'game.inOrder': '順番どおり',
                },
            }

            return translations[language]?.[key] ?? key
        },
    }),
}))

describe('TargetDisplay', () => {
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

    it('renders gameplay HUD copy using the gameplay language', () => {
        act(() => {
            root.render(
                <TargetDisplay
                    currentTarget="cat"
                    targetEmoji="🐱"
                    category={{
                        name: 'Animals & Nature',
                        items: [],
                        requiresSequence: true,
                    }}
                />,
            )
        })

        const text = document.body.textContent ?? ''
        expect(text).toContain('動物と自然')
        expect(text).toContain('見つけよう: ねこ')
        expect(text).toContain('順番どおり')
        expect(text).not.toContain('Find: ねこ')
        expect(text).not.toContain('Animals & Nature')
    })
})
