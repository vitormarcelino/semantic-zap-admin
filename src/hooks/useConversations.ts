"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSSE } from "./useSSE"
import type {
  ConversationSummary,
  ConversationFilters,
  MessageStatus,
  SSEEvent,
  AgentSummary,
} from "@/types/conversations"

interface ConversationsResponse {
  conversations: ConversationSummary[]
  total: number
  page: number
  pages: number
}

async function fetchConversations(filters: ConversationFilters): Promise<ConversationsResponse> {
  const params = new URLSearchParams({ agentId: filters.agentId })
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))
  if (filters.mode) params.set("mode", filters.mode)
  if (filters.search) params.set("search", filters.search)

  const res = await fetch(`/api/conversations?${params.toString()}`)
  if (!res.ok) throw new Error("Failed to fetch conversations")
  return res.json() as Promise<ConversationsResponse>
}

async function fetchAgents(): Promise<{ agents: AgentSummary[] }> {
  const res = await fetch("/api/agents")
  if (!res.ok) throw new Error("Failed to fetch agents")
  return res.json() as Promise<{ agents: AgentSummary[] }>
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    select: (data) => data.agents,
  })
}

export function useConversations(filters: ConversationFilters | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["conversations", filters],
    queryFn: () => fetchConversations(filters!),
    enabled: filters !== null && !!filters.agentId,
  })

  useSSE((event: SSEEvent) => {
    if (!filters?.agentId) return

    if (event.type === "new_message" && event.conversationId) {
      // Update the matching conversation's last message and re-sort
      queryClient.setQueryData<ConversationsResponse>(
        ["conversations", filters],
        (old) => {
          if (!old) return old
          const payload = event.payload as {
            message?: { content: string; role: string; status: string }
          }
          const updated = old.conversations.map((c) => {
            if (c.id !== event.conversationId) return c
            return {
              ...c,
              lastMessageAt: new Date().toISOString(),
              lastMessage: payload.message
                ? {
                    content: payload.message.content,
                    role: payload.message.role as "user" | "assistant",
                    status: payload.message.status as MessageStatus,
                  }
                : c.lastMessage,
              // Increment unreadCount for human mode incoming user messages
              unreadCount:
                payload.message?.role === "user" ? c.unreadCount + 1 : c.unreadCount,
            }
          })
          // Re-sort by lastMessageAt desc
          updated.sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          )
          return { ...old, conversations: updated }
        }
      )
    }

    if (event.type === "mode_changed" && event.conversationId) {
      const payload = event.payload as { mode?: string }
      queryClient.setQueryData<ConversationsResponse>(
        ["conversations", filters],
        (old) => {
          if (!old) return old
          return {
            ...old,
            conversations: old.conversations.map((c) =>
              c.id === event.conversationId
                ? { ...c, mode: (payload.mode ?? c.mode) as ConversationSummary["mode"] }
                : c
            ),
          }
        }
      )
      // Also refresh agents to update attention counts
      void queryClient.invalidateQueries({ queryKey: ["agents"] })
    }

    if (event.type === "conversation_updated" && event.conversationId) {
      void queryClient.invalidateQueries({ queryKey: ["conversations", filters] })
    }
  })

  return query
}
