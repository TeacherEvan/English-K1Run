/**
 * Tab list and content composition for the home window UI.
 * Delegates each tab to focused components.
 */
import type { TabConfig, TabId, TabProps } from '@/components/home-window/HomeWindow.types'
import { TabContent } from '@/components/home-window/tabs/TabContent'
import { TabList } from '@/components/home-window/tabs/TabList'
import { memo } from 'react'

interface HomeWindowTabsProps {
    tabs: TabConfig[]
    activeTab: TabId
    onTabChange: (tabId: TabId) => void
    tabProps: TabProps
}

export const HomeWindowTabs = memo(
    ({ tabs, activeTab, onTabChange, tabProps }: HomeWindowTabsProps) => (
        <>
            <TabList tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
            <div
                className="min-h-100"
                role="tabpanel"
                aria-labelledby={`tab-${activeTab}`}
                id={`tabpanel-${activeTab}`}
            >
                <TabContent {...tabProps} />
            </div>
        </>
    ),
)

HomeWindowTabs.displayName = 'HomeWindowTabs'
