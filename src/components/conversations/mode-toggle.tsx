"use client"

import { useState } from "react"
import { Bot, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConversationMode } from "@/types/conversations"

interface ModeToggleProps {
  mode: ConversationMode
  conversationId: string
  onModeChange: (mode: ConversationMode) => void
}

export function ModeToggle({ mode, conversationId, onModeChange }: ModeToggleProps) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const next: ConversationMode = mode === "bot" ? "human" : "bot"

    if (next === "bot") {
      const confirmed = window.confirm(
        "Resume bot mode? The AI agent will handle the next incoming message automatically."
      )
      if (!confirmed) return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      })
      if (res.ok) {
        onModeChange(next)
      }
    } finally {
      setLoading(false)
    }
  }

  const isHuman = mode === "human"

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        isHuman
          ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
          : "bg-[#00D060]/12 text-[#00D060] hover:bg-[#00D060]/20"
      )}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" strokeWidth={2} />
      ) : isHuman ? (
        <User size={12} strokeWidth={1.5} />
      ) : (
        <Bot size={12} strokeWidth={1.5} />
      )}
      {isHuman ? "Human mode" : "Bot active"}
    </button>
  )
}
