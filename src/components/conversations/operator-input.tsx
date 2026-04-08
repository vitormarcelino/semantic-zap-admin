"use client"

import { useRef, useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageRecord, ConversationMode } from "@/types/conversations"

const MAX_LENGTH = 4096

interface OperatorInputProps {
  conversationId: string
  mode: ConversationMode
  onMessageSent: (message: MessageRecord) => void
}

export function OperatorInput({ conversationId, mode, onMessageSent }: OperatorInputProps) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDisabled = mode === "bot"
  const canSend = value.trim().length > 0 && !sending && !isDisabled

  async function send() {
    if (!canSend) return
    const content = value.trim()
    setValue("")
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const message = (await res.json()) as MessageRecord
        onMessageSent(message)
      }
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div
      className={cn(
        "border-t border-white/8 bg-[#181C26] p-3",
        isDisabled && "opacity-50"
      )}
    >
      {isDisabled && (
        <p className="mb-2 text-center text-xs text-white/40">
          Switch to human mode to send a message
        </p>
      )}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled || sending}
            placeholder="Type a message... (Ctrl+Enter to send)"
            maxLength={MAX_LENGTH}
            rows={3}
            className={cn(
              "w-full resize-none rounded-lg border border-white/8 bg-[#0F1117] px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition-colors",
              "focus:border-white/20",
              "disabled:cursor-not-allowed"
            )}
          />
          <span className="absolute bottom-2 right-3 font-mono text-[10px] text-white/25">
            {value.length}/{MAX_LENGTH}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            canSend
              ? "bg-[#00D060] text-[#081a0e] hover:bg-[#00B854]"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" strokeWidth={2} />
          ) : (
            <Send size={16} strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  )
}
