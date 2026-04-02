import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Stopwatch } from '../Stopwatch'

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
                    'game.bestTime': 'Best Time',
                    'game.currentTime': 'Current Time',
                },
                ja: {
                    'game.bestTime': 'ベストタイム',
                    'game.currentTime': '現在のタイム',
                },
            }

            return translations[language]?.[key] ?? key
        },
    }),
}))

describe('Stopwatch', () => {
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

    it('renders gameplay timer labels using the gameplay language', () => {
        act(() => {
            root.render(<Stopwatch isRunning={false} bestTime={1234} />)
        })

        const text = document.body.textContent ?? ''
        expect(text).toContain('ベストタイム')
        expect(text).toContain('現在のタイム')
        expect(text).not.toContain('Best Time')
        expect(text).not.toContain('Current Time')
    })
})