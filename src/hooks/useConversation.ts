"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSSE } from "./useSSE"
import type { ConversationDetail, MessageRecord, SSEEvent } from "@/types/conversations"

async function fetchConversation(id: string, messagesPage = 1): Promise<ConversationDetail> {
  const res = await fetch(`/api/conversations/${id}?messagesPage=${messagesPage}`)
  if (!res.ok) throw new Error("Failed to fetch conversation")
  return res.json() as Promise<ConversationDetail>
}

export function useConversation(conversationId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId!),
    enabled: conversationId !== null,
  })

  useSSE((event: SSEEvent) => {
    if (!conversationId || event.conversationId !== conversationId) return

    if (event.type === "new_message") {
      const payload = event.payload as { message?: MessageRecord }
      if (!payload.message) return
      queryClient.setQueryData<ConversationDetail>(
        ["conversation", conversationId],
        (old) => {
          if (!old) return old
          // Avoid duplicates
          const exists = old.messages.some((m) => m.id === payload.message!.id)
          if (exists) return old
          return {
            ...old,
            messages: [...old.messages, payload.message!],
          }
        }
      )
    }

    if (event.type === "mode_changed") {
      const payload = event.payload as { mode?: string }
      queryClient.setQueryData<ConversationDetail>(
        ["conversation", conversationId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            mode: (payload.mode ?? old.mode) as ConversationDetail["mode"],
          }
        }
      )
    }

    if (event.type === "message_status") {
      const payload = event.payload as {
        messageId?: string
        status?: string
        deliveredAt?: string | null
        readAt?: string | null
      }
      if (!payload.messageId) return
      queryClient.setQueryData<ConversationDetail>(
        ["conversation", conversationId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            messages: old.messages.map((m) =>
              m.id === payload.messageId
                ? {
                    ...m,
                    status: (payload.status ?? m.status) as MessageRecord["status"],
                    deliveredAt: payload.deliveredAt ?? m.deliveredAt,
                    readAt: payload.readAt ?? m.readAt,
                  }
                : m
            ),
          }
        }
      )
    }
  })

  return query
}
