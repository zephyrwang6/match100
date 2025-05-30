"use client"

import { cn } from "@/lib/utils"

interface TabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("mb-8 flex justify-center", className)}>
      <div className="inline-flex items-center rounded-lg bg-gray-100 p-1 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out",
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
