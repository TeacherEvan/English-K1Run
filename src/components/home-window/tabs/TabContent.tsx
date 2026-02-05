/**
 * Resolves and renders the active home window tab.
 * Keeps tab switching logic in one place.
 */
import type { TabProps } from '@/components/home-window/HomeWindow.types'
import { CreditsTab } from '@/components/home-window/tabs/CreditsTab'
import { LevelsTab } from '@/components/home-window/tabs/LevelsTab'
import { SettingsTab } from '@/components/home-window/tabs/SettingsTab'
import { memo } from 'react'

export const TabContent = memo((props: TabProps) => {
    const { activeTab } = props

    switch (activeTab) {
        case 'levels':
            return <LevelsTab {...props} />
        case 'settings':
            return <SettingsTab {...props} />
        case 'credits':
            return <CreditsTab />
        default:
            return null
    }
})

TabContent.displayName = 'TabContent'
