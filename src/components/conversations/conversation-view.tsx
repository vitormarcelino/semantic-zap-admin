"use client"

import { useEffect, useRef, useCallback } from "react"
import { Loader2, MessageSquare, ChevronUp } from "lucide-react"
import { useConversation } from "@/hooks/useConversation"
import { useSSE } from "@/hooks/useSSE"
import { MessageBubble } from "./message-bubble"
import { ModeToggle } from "./mode-toggle"
import { OperatorInput } from "./operator-input"
import type { ConversationMode, MessageRecord, SSEEvent } from "@/types/conversations"

interface ConversationViewProps {
  conversationId: string
}

function SSEDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? "bg-primary" : "bg-destructive"}`}
      />
      {connected ? "Live" : "Reconnecting..."}
    </span>
  )
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const { data, isLoading, error } = useConversation(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  const { connected } = useSSE((_event: SSEEvent) => {
    void _event
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom()
    }
  }, [data?.messages?.length, scrollToBottom])

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottomRef.current = distFromBottom < 100
  }

  function handleModeChange(mode: ConversationMode) {
    void mode
  }

  function handleMessageSent(_msg: MessageRecord) {
    void _msg
    isNearBottomRef.current = true
    setTimeout(scrollToBottom, 50)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground/50" strokeWidth={1.5} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load conversation</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">{data.phoneNumber}</p>
          <p className="text-xs text-muted-foreground">{data.agentName}</p>
        </div>
        <div className="flex items-center gap-3">
          <SSEDot connected={connected} />
          <ModeToggle
            mode={data.mode}
            conversationId={conversationId}
            onModeChange={handleModeChange}
          />
        </div>
      </div>

      {/* Message list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-2 overflow-y-auto p-4"
      >
        {data.messagesTotal > data.messages.length && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronUp size={12} strokeWidth={1.5} />
              Load older messages
            </button>
          </div>
        )}

        {data.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Operator input */}
      <OperatorInput
        conversationId={conversationId}
        mode={data.mode}
        onMessageSent={handleMessageSent}
      />
    </div>
  )
}

export function ConversationEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <MessageSquare size={28} className="text-muted-foreground/40" strokeWidth={1} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Choose an agent and conversation from the left to start monitoring
        </p>
      </div>
    </div>
  )
}
