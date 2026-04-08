"use client"

import { Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { AgentSelector } from "@/components/conversations/agent-selector"
import { ConversationList } from "@/components/conversations/conversation-list"
import {
  ConversationView,
  ConversationEmptyState,
} from "@/components/conversations/conversation-view"
import { MessageSquare } from "lucide-react"

function ConversationsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const agentId = searchParams.get("agentId")
  const conversationId = searchParams.get("conversationId")

  const selectAgent = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("agentId", id)
      params.delete("conversationId")
      router.replace(`/conversations?${params.toString()}`)
    },
    [router, searchParams]
  )

  const selectConversation = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("conversationId", id)
      router.replace(`/conversations?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex h-screen bg-[#0F1117]">
      <Sidebar />

      {/* Agent selector */}
      <AgentSelector selectedAgentId={agentId} onSelect={selectAgent} />

      {/* Conversation list */}
      <div className="w-80 shrink-0">
        {agentId ? (
          <ConversationList
            agentId={agentId}
            selectedId={conversationId}
            onSelect={selectConversation}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-r border-white/8 bg-[#181C26]">
            <p className="text-xs text-white/30">Select an agent</p>
          </div>
        )}
      </div>

      {/* Conversation view */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Inner header */}
        <header className="flex shrink-0 items-center border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare
              size={16}
              className="text-white/40"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <h1 className="text-base font-semibold text-white">Conversations</h1>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {conversationId ? (
            <ConversationView conversationId={conversationId} />
          ) : (
            <ConversationEmptyState />
          )}
        </main>
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense>
      <ConversationsContent />
    </Suspense>
  )
}
