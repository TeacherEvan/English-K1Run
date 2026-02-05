/**
 * Tab list for home window navigation.
 * Handles aria attributes and active styles.
 */
import type { TabConfig, TabId } from '@/components/home-window/HomeWindow.types'
import { memo } from 'react'

interface TabListProps {
    tabs: TabConfig[]
    activeTab: TabId
    onTabChange: (tabId: TabId) => void
}

export const TabList = memo(({ tabs, activeTab, onTabChange }: TabListProps) => (
    <div className="flex justify-center mb-6" role="tablist" aria-label="Game menu tabs">
        <div className="flex space-x-2 bg-secondary/20 rounded-lg p-1">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tabpanel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 hover:scale-105 ${activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'hover:bg-secondary/40'
                        }`}
                >
                    <span aria-hidden="true">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                </button>
            ))}
        </div>
    </div>
))

TabList.displayName = 'TabList'
