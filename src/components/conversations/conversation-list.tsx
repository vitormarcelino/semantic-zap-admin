"use client"

import { useState } from "react"
import { Search, Loader2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConversationItem } from "./conversation-item"
import { useConversations } from "@/hooks/useConversations"
import type { ConversationMode } from "@/types/conversations"

type FilterTab = "all" | ConversationMode | "attention"

interface ConversationListProps {
  agentId: string
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ agentId, selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const filters = {
    agentId,
    search: search || undefined,
    mode: activeTab === "all" || activeTab === "attention" ? undefined : activeTab,
  }

  const { data, isLoading } = useConversations(filters)

  const conversations = data?.conversations ?? []
  const displayConversations =
    activeTab === "attention"
      ? conversations.filter((c) => c.mode === "human" && c.unreadCount > 0)
      : conversations

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "bot", label: "Bot" },
    { id: "human", label: "Human" },
    { id: "attention", label: "Attention" },
  ]

  const attentionCount = (data?.conversations ?? []).filter(
    (c) => c.mode === "human" && c.unreadCount > 0
  ).length

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search by phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-border/60"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 py-2 text-[11px] font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.id === "attention" && attentionCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 font-mono text-[9px] font-bold text-black">
                {attentionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground/50" strokeWidth={1.5} />
          </div>
        ) : displayConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <MessageSquare size={24} className="text-muted-foreground/30" strokeWidth={1} />
            <p className="text-xs text-muted-foreground/50">No conversations yet</p>
          </div>
        ) : (
          displayConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
