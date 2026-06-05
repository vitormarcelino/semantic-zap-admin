"use client"

import { useRef, useState, useEffect } from "react"
import { Send, Loader2, Smile } from "lucide-react"
import { cn } from "@/lib/utils"
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
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
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDisabled = mode === "bot"
  const canSend = value.trim().length > 0 && !sending && !isDisabled

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    if (showEmoji) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmoji])

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

  function insertEmoji(emojiData: EmojiClickData) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart ?? value.length
    const end = ta.selectionEnd ?? value.length
    const next = value.slice(0, start) + emojiData.emoji + value.slice(end)
    setValue(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + emojiData.emoji.length
      ta.setSelectionRange(pos, pos)
    })
  }

  return (
    <div
      className={cn(
        "border-t border-border bg-sidebar p-3",
        isDisabled && "opacity-50"
      )}
    >
      {isDisabled && (
        <p className="mb-2 text-center text-xs text-muted-foreground">
          Switch to human mode to send a message
        </p>
      )}
      <div className="relative flex items-end gap-2">
        {showEmoji && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-0 z-50 mb-2"
          >
            <EmojiPicker
              onEmojiClick={insertEmoji}
              theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
              lazyLoadEmojis
              skinTonesDisabled
              searchDisabled={false}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          disabled={isDisabled}
          title="Emoji"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            showEmoji
              ? "bg-muted text-foreground/70"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground/70",
            isDisabled && "cursor-not-allowed opacity-50"
          )}
        >
          <Smile size={16} strokeWidth={1.5} />
        </button>

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
              "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors",
              "focus:border-border/60",
              "disabled:cursor-not-allowed"
            )}
          />
          <span className="absolute bottom-2 right-3 font-mono text-[10px] text-muted-foreground/40">
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
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground"
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
