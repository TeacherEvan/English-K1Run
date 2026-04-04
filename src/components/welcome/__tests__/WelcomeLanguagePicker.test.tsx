import { SettingsProvider } from '@/context/settings-context'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WelcomeLanguagePicker } from '../WelcomeLanguagePicker'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) =>
            options?.defaultValue ?? key,
    }),
}))

describe('WelcomeLanguagePicker', () => {
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        localStorage.clear()
    })

    afterEach(() => {
        act(() => {
            root.unmount()
        })
        container.remove()
        document.body.innerHTML = ''
        localStorage.clear()
        vi.clearAllMocks()
    })

    it('calls the dismissal callback after a startup language is chosen', () => {
        const onLanguageSelected = vi.fn()

        act(() => {
            root.render(
                <SettingsProvider>
                    <WelcomeLanguagePicker
                        disabled={false}
                        onLanguageSelected={onLanguageSelected}
                    />
                </SettingsProvider>,
            )
        })

        const thaiButton = document.querySelector(
            '[data-testid="welcome-language-th"]',
        ) as HTMLButtonElement

        act(() => {
            thaiButton.click()
        })

        expect(onLanguageSelected).toHaveBeenCalledTimes(1)
        expect(thaiButton.getAttribute('aria-pressed')).toBe('true')
    })
})
